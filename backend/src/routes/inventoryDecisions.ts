import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";
import { ProductEnrichmentService } from "../services/productEnrichmentService.js";
import { InventoryDecisionEngine, InventoryDecisionInput } from "../services/inventoryDecisionEngine.js";

export const inventoryDecisionsRouter = Router();

// POST /api/inventory-decisions/parse-wizard — Natural Language decision parser
inventoryDecisionsRouter.post("/parse-wizard", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt = "", businessId } = req.body;

    if (!prompt.trim()) {
      res.status(400).json({ success: false, error: { message: "Prompt text is required." } });
      return;
    }

    const p = prompt.toLowerCase();

    // 1. Detect business type
    let detectedBusinessType = "retail";
    if (p.includes("pharmacy") || p.includes("medical store") || p.includes("chemist") || p.includes("medicine")) {
      detectedBusinessType = "pharmacy";
    } else if (p.includes("grocery") || p.includes("kirana") || p.includes("supermarket") || p.includes("snack") || p.includes("food")) {
      detectedBusinessType = "grocery";
    } else if (p.includes("quick-commerce") || p.includes("dark store") || p.includes("blinkit") || p.includes("zepto") || p.includes("instamart")) {
      detectedBusinessType = "quick_commerce";
    } else if (p.includes("restaurant") || p.includes("cafe") || p.includes("bakery")) {
      detectedBusinessType = "restaurant";
    } else if (p.includes("startup") || p.includes("saas") || p.includes("software")) {
      detectedBusinessType = "startup";
    }

    // 2. Extract proposed quantity
    let extractedQuantity = 20; // default
    const qtyMatch = prompt.match(/(\d+)\s*(additional|extra|more|new)?\s*(packs?|units?|boxes?|cases?|strips?|bottles?|kg|cartons?)/i) ||
      prompt.match(/order\s+(\d+)/i) ||
      prompt.match(/buy\s+(\d+)/i) ||
      prompt.match(/purchase\s+(\d+)/i);

    if (qtyMatch && qtyMatch[1]) {
      extractedQuantity = parseInt(qtyMatch[1], 10);
    }

    // 3. Extract product keyword intelligently
    let productKeyword = "";

    // Pattern: "order 20 packs of [Product Name]" or "buy 50 units of [Product Name]"
    const explicitProductMatch = prompt.match(/(?:order|buy|purchase|refill|get|stock)\s+(?:\d+\s+(?:additional|extra|more)?\s*(?:packs?|units?|boxes?|cases?|strips?|bottles?|kg|cartons?)\s+of\s+)([^,?.!]+)/i) ||
      prompt.match(/(?:order|buy|purchase|refill|get)\s+([^,?.!]+?)(?:\s+before|\s+with|\s+at|\s+for|\?|$)/i);

    if (explicitProductMatch && explicitProductMatch[1]?.trim().length > 2) {
      productKeyword = explicitProductMatch[1].trim();
    } else if (detectedBusinessType === "pharmacy") {
      if (p.includes("dolo 650") || p.includes("dolo")) {
        productKeyword = "Paracetamol 650mg";
      } else if (p.includes("pain") || p.includes("paracetamol") || p.includes("crocin") || p.includes("calpol")) {
        productKeyword = "Paracetamol Tablets";
      } else if (p.includes("antibiotic") || p.includes("amoxicillin") || p.includes("mox")) {
        productKeyword = "Amoxicillin 500mg";
      } else if (p.includes("allergy") || p.includes("cetirizine") || p.includes("cold")) {
        productKeyword = "Cetirizine 10mg";
      } else if (p.includes("azithromycin")) {
        productKeyword = "Azithromycin 500mg";
      } else if (p.includes("pantoprazole") || p.includes("pan 40")) {
        productKeyword = "Pantoprazole 40mg";
      } else if (p.includes("ors") || p.includes("electral")) {
        productKeyword = "Oral Rehydration Salts";
      } else {
        productKeyword = "Pain-relief tablets";
      }
    } else if (detectedBusinessType === "grocery" || detectedBusinessType === "quick_commerce") {
      if (p.includes("snack") || p.includes("chips") || p.includes("lays")) {
        productKeyword = "Potato Chips";
      } else if (p.includes("atta") || p.includes("flour") || p.includes("wheat")) {
        productKeyword = "Whole Wheat Atta 5kg";
      } else if (p.includes("oil") || p.includes("ghee")) {
        productKeyword = "Pure Ghee 1L";
      } else if (p.includes("maggi") || p.includes("noodles")) {
        productKeyword = "Instant 2-Minute Noodles";
      } else if (p.includes("biscuit") || p.includes("parle")) {
        productKeyword = "Original Glucose Biscuits";
      } else {
        productKeyword = "Packaged snack";
      }
    } else {
      productKeyword = "Inventory product";
    }

    // 4. Enrich with verified catalog / Open Food Facts
    const { results, disclaimer } = await ProductEnrichmentService.searchProducts(productKeyword, detectedBusinessType);
    const matchedProduct = results.length > 0 ? results[0] : null;

    // Check if user already has this product in business inventory
    let existingInventoryProduct: any = null;
    let inventoryMatches: any[] = [];
    if (businessId) {
      inventoryMatches = await prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            { name: { contains: productKeyword } },
            ...(matchedProduct?.brand ? [{ brand: { contains: matchedProduct.brand } }] : []),
          ],
        },
        include: {
          supplierQuotes: { take: 1, orderBy: { quotedUnitCost: "asc" } },
        },
        take: 5,
      });

      if (inventoryMatches.length > 0) {
        existingInventoryProduct = inventoryMatches[0];
      }
    }

    res.json({
      success: true,
      data: {
        rawPrompt: prompt,
        detectedBusinessType,
        extractedQuantity,
        productKeyword,
        matchedProduct,
        allMatches: results,
        disclaimer,
        existingInventory: existingInventoryProduct
          ? {
              productId: existingInventoryProduct.id,
              name: existingInventoryProduct.name,
              currentStock: existingInventoryProduct.stockOnHand,
              unitCost: existingInventoryProduct.purchasePrice,
              sellingPrice: existingInventoryProduct.sellingPrice,
              reorderPoint: existingInventoryProduct.reorderPoint,
              leadTimeDays: existingInventoryProduct.supplierQuotes?.[0]?.leadTimeDays || 3,
            }
          : null,
        suggestedFields: {
          decisionQuestion: prompt.trim(),
          productName: existingInventoryProduct?.name || matchedProduct?.name || productKeyword,
          currentStock: existingInventoryProduct?.stockOnHand ?? 10,
          proposedOrderQuantity: extractedQuantity,
          unitCost: existingInventoryProduct?.purchasePrice || matchedProduct?.estimatedWholesalePrice || 20,
          sellingPrice: existingInventoryProduct?.sellingPrice || matchedProduct?.suggestedRetailPrice || 30,
          leadTimeDays: existingInventoryProduct?.supplierQuotes?.[0]?.leadTimeDays || 3,
          minOrderQuantity: matchedProduct?.packSize || 10,
          averageDailySales: 4,
          planningHorizonDays: 30,
          holdingCostRatePerMonth: 0.02,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory-decisions/enrich-product — Instant product search, knowledge lookup & record synchronizer
inventoryDecisionsRouter.post("/enrich-product", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query = "", barcode = "", businessId, categoryType } = req.body;

    // 1. External catalog search (Open Food Facts / NPPA / CDSCO / FMCG)
    const { results, disclaimer } = await ProductEnrichmentService.searchProducts(query, categoryType, barcode);
    const matchedProduct = results.length > 0 ? results[0] : null;

    // 2. Business internal inventory lookup
    let inventoryMatches: any[] = [];
    let matchedInventoryProduct: any = null;
    if (businessId) {
      inventoryMatches = await prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
          OR: [
            ...(query ? [{ name: { contains: query } }, { brand: { contains: query } }] : []),
            ...(barcode ? [{ barcode }] : []),
          ],
        },
        include: {
          supplierQuotes: { take: 1, orderBy: { quotedUnitCost: "asc" } },
          salesRecords: { take: 14, orderBy: { date: "desc" } },
        },
        take: 6,
      });

      if (inventoryMatches.length > 0) {
        matchedInventoryProduct = inventoryMatches[0];
      }
    }

    // 3. Compute accurate terms
    const unitCost = matchedInventoryProduct?.purchasePrice 
      || matchedProduct?.estimatedWholesalePrice 
      || 15;
    const sellingPrice = matchedInventoryProduct?.sellingPrice 
      || matchedProduct?.suggestedRetailPrice 
      || (unitCost > 0 ? Math.round(unitCost * 1.35 * 100) / 100 : 22);
    const currentStock = matchedInventoryProduct?.stockOnHand ?? 10;
    
    // Calculate average daily sales if salesRecords exist
    let averageDailySales = 4;
    if (matchedInventoryProduct?.salesRecords?.length > 0) {
      const totalUnits = matchedInventoryProduct.salesRecords.reduce((sum: number, r: any) => sum + r.quantity, 0);
      averageDailySales = Math.max(1, Math.round((totalUnits / matchedInventoryProduct.salesRecords.length) * 10) / 10);
    }

    const leadTimeDays = matchedInventoryProduct?.supplierQuotes?.[0]?.leadTimeDays || 3;
    const minOrderQuantity = matchedProduct?.packSize || 10;
    const packSize = matchedProduct?.packSize || matchedInventoryProduct?.packSize || 1;
    const packUnit = matchedProduct?.packUnit || matchedInventoryProduct?.packUnit || "pack";
    const shelfLifeDays = 180;

    res.json({
      success: true,
      data: {
        query,
        barcode,
        matchedProduct,
        allMatches: results,
        inventoryMatches: inventoryMatches.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          barcode: p.barcode,
          stockOnHand: p.stockOnHand,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          reorderPoint: p.reorderPoint,
          unit: p.unit,
          packSize: p.packSize,
          leadTimeDays: p.supplierQuotes?.[0]?.leadTimeDays || 3,
        })),
        matchedInventory: matchedInventoryProduct ? {
          productId: matchedInventoryProduct.id,
          name: matchedInventoryProduct.name,
          currentStock: matchedInventoryProduct.stockOnHand,
          unitCost: matchedInventoryProduct.purchasePrice,
          sellingPrice: matchedInventoryProduct.sellingPrice,
          reorderPoint: matchedInventoryProduct.reorderPoint,
          leadTimeDays,
          averageDailySales,
        } : null,
        disclaimer,
        suggestedTerms: {
          productName: matchedInventoryProduct?.name || matchedProduct?.name || query,
          brand: matchedProduct?.brand || matchedInventoryProduct?.brand || "",
          category: matchedProduct?.category || matchedInventoryProduct?.category || "General",
          currentStock,
          unitCost,
          sellingPrice,
          leadTimeDays,
          minOrderQuantity,
          packSize,
          packUnit,
          averageDailySales,
          shelfLifeDays,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory-decisions/simulate — Execute 3-path simulation
inventoryDecisionsRouter.post("/simulate", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: InventoryDecisionInput = req.body;

    if (!input.decisionQuestion || !input.productName) {
      res.status(400).json({
        success: false,
        error: { message: "decisionQuestion and productName are required." },
      });
      return;
    }

    const result = InventoryDecisionEngine.evaluateDecision(input);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory-decisions/save-report — Persist report
inventoryDecisionsRouter.post("/save-report", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { businessId, decisionId, title, question, recommendation, summaryText, planningHorizonDays, simulationResult, assumptions, missingInfo } = req.body;

    if (!businessId || !title || !question) {
      res.status(400).json({ success: false, error: { message: "businessId, title, and question are required." } });
      return;
    }

    const report = await prisma.decisionReport.create({
      data: {
        businessId,
        decisionId: decisionId || null,
        title,
        question,
        recommendation: recommendation || "proceed",
        summaryText: summaryText || "",
        planningHorizonDays: planningHorizonDays || 30,
        financialMetrics: JSON.stringify(simulationResult || {}),
        scenariosSnapshot: JSON.stringify(simulationResult?.scenarios || {}),
        assumptions: JSON.stringify(assumptions || []),
        missingInformation: JSON.stringify(missingInfo || []),
        createdBy: req.user!.email,
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/inventory-decisions/reports — List saved decision reports for a business
inventoryDecisionsRouter.get("/reports", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const where: any = {};
    if (businessId) where.businessId = businessId;

    const reports = await prisma.decisionReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory-decisions/generate-workflow — Convert decision into visual node graph in canvas
inventoryDecisionsRouter.post("/generate-workflow", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { businessId, simulationResult, title = "Inventory Decision Workflow" } = req.body;

    const sim = simulationResult as any;
    const pName = sim?.productName || "Product";
    const pathA = sim?.pathA_Proposed;

    // Create workflow with nodes
    const workflow = await prisma.workflow.create({
      data: {
        ownerId: userId,
        businessId: businessId || null,
        title: `${title} — ${pName}`,
        description: `Automated decision graph evaluating purchase of ${pathA?.orderQuantity || 20} units of ${pName}.`,
        status: "active",
      },
    });

    // Generate Left-to-Right nodes
    const nodesData = [
      {
        workflowId: workflow.id,
        type: "business_profile",
        title: "1. Business Context",
        positionX: 50,
        positionY: 150,
        config: JSON.stringify({ businessType: "Store / Retail", currency: "INR" }),
      },
      {
        workflowId: workflow.id,
        type: "product_lookup",
        title: `2. Product: ${pName}`,
        positionX: 320,
        positionY: 150,
        config: JSON.stringify({ productName: pName, category: "Fast-moving Inventory" }),
      },
      {
        workflowId: workflow.id,
        type: "inventory_snapshot",
        title: "3. Current Stock",
        positionX: 590,
        positionY: 80,
        config: JSON.stringify({ currentStock: pathA?.availableStockTotal - pathA?.orderQuantity || 10 }),
      },
      {
        workflowId: workflow.id,
        type: "proposed_purchase",
        title: `4. Proposed Order (${pathA?.orderQuantity || 20} units)`,
        positionX: 590,
        positionY: 280,
        config: JSON.stringify({
          orderQuantity: pathA?.orderQuantity || 20,
          capitalRequired: pathA?.capitalRequired || 400,
        }),
      },
      {
        workflowId: workflow.id,
        type: "demand_forecast",
        title: "5. Demand Forecast",
        positionX: 880,
        positionY: 180,
        config: JSON.stringify({
          expectedDemand: pathA?.expectedDemand || 30,
          horizonDays: sim?.planningHorizonDays || 30,
        }),
      },
      {
        workflowId: workflow.id,
        type: "scenario_branch",
        title: "6. Scenario Branch",
        positionX: 1180,
        positionY: 180,
        config: JSON.stringify({
          pathA_Gain: pathA?.netFinancialGain || 0,
          pathB_Gain: sim?.pathB_DoNotProceed?.netFinancialGain || 0,
          pathC_Gain: sim?.pathC_Alternative?.netFinancialGain || 0,
        }),
      },
      {
        workflowId: workflow.id,
        type: "recommendation",
        title: "7. Recommendation & Report",
        positionX: 1480,
        positionY: 180,
        config: JSON.stringify({
          recommendedPath: sim?.recommendedPath || "A",
          title: sim?.recommendationTitle || "Proceed with purchase",
          summary: sim?.recommendationSummary || "",
        }),
      },
    ];

    const createdNodes: any[] = [];
    for (const nd of nodesData) {
      const created = await prisma.workflowNode.create({ data: nd });
      createdNodes.push(created);
    }

    // Create edges connecting sequentially
    for (let i = 0; i < createdNodes.length - 1; i++) {
      await prisma.workflowEdge.create({
        data: {
          workflowId: workflow.id,
          sourceNodeId: createdNodes[i].id,
          targetNodeId: createdNodes[i + 1].id,
          sourceHandle: "output",
          targetHandle: "input",
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        workflowId: workflow.id,
        workflowTitle: workflow.title,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
