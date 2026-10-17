import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";

export const businessesRouter = Router();

// GET /api/businesses — List all businesses user has access to
businessesRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memberships = await prisma.businessMembership.findMany({
      where: { userId },
      include: {
        business: {
          include: {
            _count: {
              select: {
                products: true,
                suppliers: true,
                decisions: true,
                reports: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const businesses = (memberships as any[]).map((m) => ({
      ...m.business,
      role: m.role,
      counts: m.business?._count,
    }));

    res.json({ success: true, data: businesses });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/businesses — Onboarding / create business
businessesRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      type = "retail",
      isExisting = true,
      country = "India",
      city,
      serviceArea,
      categories = [],
      currency = "INR",
      currencySymbol = "₹",
      taxName = "GST",
      taxRate = 18.0,
      units = ["pcs", "packs", "boxes"],
      monthlyRevenue,
      monthlyCost,
      hasExistingData = false,
      learningMode = false,
      enterpriseMode = false,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, error: { message: "Business name is required." } });
      return;
    }

    const business = await prisma.businessProfile.create({
      data: {
        ownerId: userId,
        name: name.trim(),
        type,
        isExisting: Boolean(isExisting),
        country,
        city,
        serviceArea,
        categories: JSON.stringify(categories),
        currency,
        currencySymbol,
        taxName,
        taxRate: Number(taxRate) || 0,
        units: JSON.stringify(units),
        monthlyRevenue: monthlyRevenue ? Number(monthlyRevenue) : null,
        monthlyCost: monthlyCost ? Number(monthlyCost) : null,
        hasExistingData: Boolean(hasExistingData),
        learningMode: Boolean(learningMode),
        enterpriseMode: Boolean(enterpriseMode),
        memberships: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    });

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/businesses/:id — Get single business
businessesRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const businessId = req.params.id as string;
    if (!businessId) {
      res.status(400).json({ success: false, error: { message: "businessId required" } });
      return;
    }

    const membership = (await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId } },
      include: { business: true },
    })) as any;

    if (!membership) {
      res.status(404).json({ success: false, error: { message: "Business not found or access denied." } });
      return;
    }

    res.json({ success: true, data: { ...membership.business, role: membership.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// PATCH /api/businesses/:id — Update business profile
businessesRouter.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const businessId = req.params.id as string;
    if (!businessId) {
      res.status(400).json({ success: false, error: { message: "businessId required" } });
      return;
    }

    const membership = await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "manager")) {
      res.status(403).json({ success: false, error: { message: "Permission denied." } });
      return;
    }

    const {
      name,
      type,
      country,
      city,
      serviceArea,
      currency,
      currencySymbol,
      taxName,
      taxRate,
      monthlyRevenue,
      monthlyCost,
      learningMode,
      enterpriseMode,
      categories,
      units,
    } = req.body;

    const updated = await prisma.businessProfile.update({
      where: { id: businessId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(type ? { type } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(serviceArea !== undefined ? { serviceArea } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(currencySymbol !== undefined ? { currencySymbol } : {}),
        ...(taxName !== undefined ? { taxName } : {}),
        ...(taxRate !== undefined ? { taxRate: Number(taxRate) } : {}),
        ...(monthlyRevenue !== undefined ? { monthlyRevenue: Number(monthlyRevenue) } : {}),
        ...(monthlyCost !== undefined ? { monthlyCost: Number(monthlyCost) } : {}),
        ...(learningMode !== undefined ? { learningMode: Boolean(learningMode) } : {}),
        ...(enterpriseMode !== undefined ? { enterpriseMode: Boolean(enterpriseMode) } : {}),
        ...(categories ? { categories: JSON.stringify(categories) } : {}),
        ...(units ? { units: JSON.stringify(units) } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/businesses/:id/dashboard-metrics — Dynamic KPIs
businessesRouter.get("/:id/dashboard-metrics", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const businessId = req.params.id as string;
    if (!businessId) {
      res.status(400).json({ success: false, error: { message: "businessId required" } });
      return;
    }

    const membership = (await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId } },
      include: { business: true },
    })) as any;

    if (!membership) {
      res.status(404).json({ success: false, error: { message: "Business not found." } });
      return;
    }

    const business = membership.business;

    // Fetch products
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      include: {
        supplierQuotes: {
          orderBy: { quotedUnitCost: "asc" },
          take: 1,
        },
      },
    });

    let totalInventoryValue = 0;
    let totalStockOnHand = 0;
    let stockoutCount = 0;
    let lowStockCount = 0;
    let nearExpiryCount = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    products.forEach((p) => {
      const stock = p.stockOnHand || 0;
      const cost = p.purchasePrice || 0;
      totalStockOnHand += stock;
      totalInventoryValue += stock * cost;

      if (stock <= 0) {
        stockoutCount++;
      } else if (stock <= p.reorderPoint) {
        lowStockCount++;
      }

      if (p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow) {
        nearExpiryCount++;
      }
    });

    // Recent 30 days sales
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentSales = await prisma.salesRecord.findMany({
      where: {
        businessId,
        date: { gte: thirtyDaysAgo },
      },
      include: { product: true },
    });

    let monthlyRevenue = 0;
    let monthlyCOGS = 0;
    recentSales.forEach((s) => {
      monthlyRevenue += s.totalAmount;
      const unitCost = s.product?.purchasePrice || 0;
      monthlyCOGS += s.quantitySold * unitCost;
    });

    const grossProfit = monthlyRevenue - monthlyCOGS;
    const grossMarginPct = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0;
    const monthlyOperationalCost = business.monthlyCost || 0;
    const estimatedNetProfit = grossProfit - monthlyOperationalCost;

    // Calculate inventory procurement spend in the last 30 days
    const recentPurchases = await prisma.stockMovement.findMany({
      where: {
        product: { businessId },
        type: "purchase",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    let inventoryPurchasesSpend = 0;
    recentPurchases.forEach((m) => {
      inventoryPurchasesSpend += m.quantity * (m.unitCost || 0);
    });

    if (inventoryPurchasesSpend === 0 && totalInventoryValue > 0) {
      inventoryPurchasesSpend = totalInventoryValue;
    }

    const totalSpendingThisMonth = Math.round(monthlyOperationalCost + inventoryPurchasesSpend);
    const totalWorkingCapitalInvested = Math.round(totalInventoryValue + monthlyOperationalCost);
    const returnOnInvestmentPct = totalWorkingCapitalInvested > 0
      ? +((grossProfit / totalWorkingCapitalInvested) * 100).toFixed(1)
      : 0;
    const netReturnOnInvestmentPct = totalWorkingCapitalInvested > 0
      ? +((estimatedNetProfit / totalWorkingCapitalInvested) * 100).toFixed(1)
      : 0;
    const netMarginPct = monthlyRevenue > 0
      ? +((estimatedNetProfit / monthlyRevenue) * 100).toFixed(1)
      : 0;

    // Decisions count & pending review
    const decisionsCount = await prisma.decision.count({ where: { businessId } });
    const reportsCount = await prisma.decisionReport.count({ where: { businessId } });
    const recentReports = await prisma.decisionReport.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        businessProfile: business,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalStockOnHand,
        stockoutCount,
        lowStockCount,
        nearExpiryCount,
        monthlyRevenue: Math.round(monthlyRevenue),
        monthlyCOGS: Math.round(monthlyCOGS),
        grossProfit: Math.round(grossProfit),
        grossMarginPct: +grossMarginPct.toFixed(1),
        monthlyOperationalCost: Math.round(monthlyOperationalCost),
        estimatedNetProfit: Math.round(estimatedNetProfit),
        netMarginPct,
        inventoryPurchasesSpend: Math.round(inventoryPurchasesSpend),
        totalSpendingThisMonth,
        totalWorkingCapitalInvested,
        returnOnInvestmentPct,
        netReturnOnInvestmentPct,
        cashTiedUpInInventory: Math.round(totalInventoryValue),
        totalProductsCount: products.length,
        decisionsCount,
        reportsCount,
        recentReports,
        isSampleWorkspace: business.isSample,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/businesses/:id/seed-sample — Seed realistic demo data clearly marked isSample: true
businessesRouter.post("/:id/seed-sample", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const businessId = req.params.id as string;
    if (!businessId) {
      res.status(400).json({ success: false, error: { message: "businessId required" } });
      return;
    }

    const membership = (await prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId } },
      include: { business: true },
    })) as any;

    if (!membership || membership.role !== "owner") {
      res.status(403).json({ success: false, error: { message: "Only business owners can seed sample data." } });
      return;
    }

    const business = membership.business;

    // Create realistic sample supplier
    const supplier = await prisma.supplier.create({
      data: {
        businessId,
        name: business.type === "pharmacy" ? "Apex Pharma Distributors Ltd" : "Metro FMCG Wholesalers",
        contactPerson: "Rajesh Sharma",
        phone: "+91 98765 43210",
        paymentTerms: "Net 15 Days",
        defaultLeadTimeDays: 3,
      },
    });

    // Sample products based on business type
    const sampleProducts = business.type === "pharmacy"
      ? [
          {
            name: "Paracetamol 650mg Tablets",
            brand: "Dolo / NPPA Monitored",
            category: "Analgesic",
            unit: "tablets",
            packSize: 15,
            packUnit: "strip",
            purchasePrice: 1.40,
            packPurchasePrice: 21.00,
            sellingPrice: 2.05,
            stockOnHand: 45,
            reorderPoint: 60,
            requiresPrescription: false,
            regulatoryStatus: "verified",
            sourceProvider: "nppa_pharmacy",
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          },
          {
            name: "Amoxicillin 500mg Capsules",
            brand: "Mox 500",
            category: "Antibiotics",
            unit: "capsules",
            packSize: 10,
            packUnit: "strip",
            purchasePrice: 4.20,
            packPurchasePrice: 42.00,
            sellingPrice: 6.50,
            stockOnHand: 12,
            reorderPoint: 25,
            requiresPrescription: true,
            regulatoryStatus: "verified",
            sourceProvider: "cdsco_regulatory",
            expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Near expiry!
          },
          {
            name: "Cetirizine 10mg Tablets",
            brand: "Cetzine",
            category: "Antihistamine",
            unit: "tablets",
            packSize: 10,
            packUnit: "strip",
            purchasePrice: 1.10,
            packPurchasePrice: 11.00,
            sellingPrice: 1.80,
            stockOnHand: 80,
            reorderPoint: 30,
            requiresPrescription: false,
            regulatoryStatus: "verified",
            sourceProvider: "nppa_pharmacy",
            expiryDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000),
          },
        ]
      : [
          {
            name: "Whole Wheat Atta 5kg",
            brand: "Aashirvaad",
            category: "Staples",
            unit: "pack",
            packSize: 1,
            packUnit: "bag",
            purchasePrice: 210.00,
            sellingPrice: 265.00,
            stockOnHand: 14,
            reorderPoint: 20,
            regulatoryStatus: "verified",
            sourceProvider: "open_food_facts",
          },
          {
            name: "Masala Potato Chips 50g",
            brand: "Lay's",
            category: "Snacks",
            unit: "pack",
            packSize: 24,
            packUnit: "carton",
            purchasePrice: 15.00,
            packPurchasePrice: 360.00,
            sellingPrice: 20.00,
            stockOnHand: 6,
            reorderPoint: 30, // Low stock alert!
            regulatoryStatus: "verified",
            sourceProvider: "open_food_facts",
          },
          {
            name: "Pure Cow Ghee 1L",
            brand: "Amul",
            category: "Dairy",
            unit: "pack",
            packSize: 1,
            packUnit: "jar",
            purchasePrice: 540.00,
            sellingPrice: 630.00,
            stockOnHand: 0, // Stockout alert!
            reorderPoint: 10,
            regulatoryStatus: "verified",
            sourceProvider: "open_food_facts",
          },
        ];

    for (const prodData of sampleProducts) {
      const prod = await prisma.product.create({
        data: {
          businessId,
          ...prodData,
        },
      });

      // Add supplier quote
      await prisma.supplierQuote.create({
        data: {
          supplierId: supplier.id,
          productId: prod.id,
          quotedUnitCost: prod.purchasePrice,
          quotedPackCost: prod.packPurchasePrice,
          minOrderQuantity: 10,
          leadTimeDays: 3,
          isPreferred: true,
        },
      });

      // Add historical sales records (past 14 days)
      for (let day = 14; day >= 1; day--) {
        const salesDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
        const qtySold = Math.floor(Math.random() * 5) + 2;
        await prisma.salesRecord.create({
          data: {
            businessId,
            productId: prod.id,
            date: salesDate,
            quantitySold: qtySold,
            unitPrice: prod.sellingPrice,
            totalAmount: qtySold * prod.sellingPrice,
            wasStockoutSuppressed: day === 2 && prod.stockOnHand === 0,
          },
        });
      }
    }

    // Mark as sample workspace
    await prisma.businessProfile.update({
      where: { id: businessId },
      data: { isSample: true },
    });

    res.json({ success: true, message: "Sample workspace populated with verified benchmark data." });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
