import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";
import { ProductEnrichmentService } from "../services/productEnrichmentService.js";

export const productsRouter = Router();

// Middleware helper to ensure user belongs to business
async function checkBusinessAccess(req: AuthRequest, res: Response, next: () => void) {
  const businessId = (req.query.businessId as string) || req.body.businessId;
  if (!businessId) {
    res.status(400).json({ success: false, error: { message: "businessId parameter is required." } });
    return;
  }

  const membership = await prisma.businessMembership.findUnique({
    where: { businessId_userId: { businessId, userId: req.user!.id } },
  });

  if (!membership) {
    res.status(403).json({ success: false, error: { message: "Access denied to this business." } });
    return;
  }

  (req as any).businessRole = membership.role;
  next();
}

// GET /api/products/search-external — Open Food Facts & Pharmacy verified lookup
productsRouter.get("/search-external", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || "";
    const barcode = (req.query.barcode as string) || "";
    const categoryType = (req.query.categoryType as string) || "";

    const { results, disclaimer } = await ProductEnrichmentService.searchProducts(query, categoryType, barcode);
    res.json({ success: true, data: { results, disclaimer } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/products — List products for a business
productsRouter.get("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const stockStatus = req.query.stockStatus as string; // all, in_stock, low_stock, out_of_stock, near_expiry

    const where: any = { businessId, isActive: true };

    if (search.trim()) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { barcode: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (category.trim()) {
      where.category = category;
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        supplierQuotes: {
          include: { supplier: true },
          orderBy: { quotedUnitCost: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    if (stockStatus) {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      products = products.filter((p) => {
        if (stockStatus === "out_of_stock") return p.stockOnHand <= 0;
        if (stockStatus === "low_stock") return p.stockOnHand > 0 && p.stockOnHand <= p.reorderPoint;
        if (stockStatus === "in_stock") return p.stockOnHand > p.reorderPoint;
        if (stockStatus === "near_expiry") return p.expiryDate && new Date(p.expiryDate) <= thirtyDays;
        return true;
      });
    }

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/products — Add product
productsRouter.post("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessId,
      name,
      brand,
      barcode,
      sku,
      category,
      unit = "pcs",
      packSize = 1,
      packUnit,
      purchasePrice,
      packPurchasePrice,
      sellingPrice,
      taxRate = 0,
      stockOnHand = 0,
      reorderPoint = 10,
      preferredStock,
      batchNumber,
      expiryDate,
      storageCondition,
      requiresPrescription = false,
      regulatoryStatus,
      sourceProvider = "manual",
      sourceUrl,
      verificationConfidence,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, error: { message: "Product name is required." } });
      return;
    }

    const parsedPackSize = Math.max(1, parseInt(packSize, 10) || 1);
    
    // Calculate unit purchase price if pack purchase price provided
    let finalUnitPurchasePrice = Number(purchasePrice) || 0;
    let finalPackPurchasePrice = packPurchasePrice !== undefined && packPurchasePrice !== null ? Number(packPurchasePrice) : null;
    
    if (finalPackPurchasePrice && (!finalUnitPurchasePrice || finalUnitPurchasePrice === 0)) {
      finalUnitPurchasePrice = +(finalPackPurchasePrice / parsedPackSize).toFixed(2);
    } else if (finalUnitPurchasePrice && !finalPackPurchasePrice && parsedPackSize > 1) {
      finalPackPurchasePrice = +(finalUnitPurchasePrice * parsedPackSize).toFixed(2);
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name: name.trim(),
        brand: brand?.trim() || null,
        barcode: barcode?.trim() || null,
        sku: sku?.trim() || null,
        category: category?.trim() || null,
        unit,
        packSize: parsedPackSize,
        packUnit: packUnit || null,
        purchasePrice: finalUnitPurchasePrice,
        packPurchasePrice: finalPackPurchasePrice,
        sellingPrice: Number(sellingPrice) || finalUnitPurchasePrice * 1.3,
        taxRate: Number(taxRate) || 0,
        stockOnHand: Number(stockOnHand) || 0,
        reorderPoint: Number(reorderPoint) || 10,
        preferredStock: preferredStock ? Number(preferredStock) : null,
        batchNumber: batchNumber || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        storageCondition: storageCondition || null,
        requiresPrescription: Boolean(requiresPrescription),
        regulatoryStatus: regulatoryStatus || "unverified",
        sourceProvider,
        sourceUrl: sourceUrl || null,
        verificationConfidence: verificationConfidence ? Number(verificationConfidence) : null,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/products/:id — Get product details
productsRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        supplierQuotes: { include: { supplier: true } },
        stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
        salesRecords: { orderBy: { date: "desc" }, take: 30 },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, error: { message: "Product not found." } });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// PATCH /api/products/:id — Update product
productsRouter.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ success: false, error: { message: "Product not found." } });
      return;
    }

    const {
      name,
      brand,
      barcode,
      sku,
      category,
      unit,
      packSize,
      packUnit,
      purchasePrice,
      packPurchasePrice,
      sellingPrice,
      taxRate,
      stockOnHand,
      reorderPoint,
      preferredStock,
      batchNumber,
      expiryDate,
      storageCondition,
      requiresPrescription,
      regulatoryStatus,
    } = req.body;

    const parsedPackSize = packSize !== undefined ? Math.max(1, parseInt(packSize, 10)) : existing.packSize;
    let finalUnitCost = purchasePrice !== undefined ? Number(purchasePrice) : existing.purchasePrice;
    let finalPackCost = packPurchasePrice !== undefined ? Number(packPurchasePrice) : existing.packPurchasePrice;

    if (packPurchasePrice !== undefined && purchasePrice === undefined) {
      finalUnitCost = +(finalPackCost! / parsedPackSize).toFixed(2);
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(brand !== undefined ? { brand } : {}),
        ...(barcode !== undefined ? { barcode } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(unit !== undefined ? { unit } : {}),
        packSize: parsedPackSize,
        ...(packUnit !== undefined ? { packUnit } : {}),
        purchasePrice: finalUnitCost,
        packPurchasePrice: finalPackCost,
        ...(sellingPrice !== undefined ? { sellingPrice: Number(sellingPrice) } : {}),
        ...(taxRate !== undefined ? { taxRate: Number(taxRate) } : {}),
        ...(stockOnHand !== undefined ? { stockOnHand: Number(stockOnHand) } : {}),
        ...(reorderPoint !== undefined ? { reorderPoint: Number(reorderPoint) } : {}),
        ...(preferredStock !== undefined ? { preferredStock: Number(preferredStock) } : {}),
        ...(batchNumber !== undefined ? { batchNumber } : {}),
        ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
        ...(storageCondition !== undefined ? { storageCondition } : {}),
        ...(requiresPrescription !== undefined ? { requiresPrescription: Boolean(requiresPrescription) } : {}),
        ...(regulatoryStatus !== undefined ? { regulatoryStatus } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// DELETE /api/products/:id — Soft delete
productsRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: "Product archived." });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/products/bulk-preview — Parse and preview CSV / Excel import rows
productsRouter.post("/bulk-preview", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rows = [] } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, error: { message: "No rows provided for import." } });
      return;
    }

    const validatedRows: any[] = [];
    const errors: { row: number; error: string }[] = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const name = r.name || r["Product Name"] || r.title;
      if (!name || typeof name !== "string" || !name.trim()) {
        errors.push({ row: rowNum, error: "Missing product name" });
        return;
      }

      const purchasePrice = parseFloat(r.purchasePrice || r["Purchase Price"] || r.cost || 0);
      const sellingPrice = parseFloat(r.sellingPrice || r["Selling Price"] || r.price || 0);
      const stockOnHand = parseFloat(r.stockOnHand || r["Stock"] || r.stock || 0);
      const packSize = parseInt(r.packSize || r["Pack Size"] || 1, 10);

      validatedRows.push({
        rowNum,
        name: name.trim(),
        brand: r.brand || r["Brand"] || null,
        category: r.category || r["Category"] || "General",
        barcode: r.barcode || r["Barcode"] || null,
        sku: r.sku || r["SKU"] || null,
        packSize: packSize > 0 ? packSize : 1,
        purchasePrice: purchasePrice >= 0 ? purchasePrice : 0,
        sellingPrice: sellingPrice >= 0 ? sellingPrice : purchasePrice * 1.3,
        stockOnHand: stockOnHand >= 0 ? stockOnHand : 0,
        reorderPoint: parseFloat(r.reorderPoint || r["Reorder Point"] || 10),
      });
    });

    res.json({
      success: true,
      data: {
        totalRows: rows.length,
        validCount: validatedRows.length,
        errorCount: errors.length,
        validatedRows,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/products/bulk-commit — Commit validated rows to database
productsRouter.post("/bulk-commit", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { businessId, rows = [] } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, error: { message: "No rows to import." } });
      return;
    }

    let createdCount = 0;
    for (const r of rows) {
      if (!r.name) continue;
      await prisma.product.create({
        data: {
          businessId,
          name: r.name,
          brand: r.brand || null,
          category: r.category || null,
          barcode: r.barcode || null,
          sku: r.sku || null,
          packSize: r.packSize || 1,
          purchasePrice: Number(r.purchasePrice) || 0,
          sellingPrice: Number(r.sellingPrice) || 0,
          stockOnHand: Number(r.stockOnHand) || 0,
          reorderPoint: Number(r.reorderPoint) || 10,
          sourceProvider: "excel_import",
          regulatoryStatus: "unverified",
        },
      });
      createdCount++;
    }

    res.json({ success: true, message: `Successfully imported ${createdCount} products.` });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
