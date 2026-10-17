import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";
import { DemandForecastService } from "../services/demandForecastService.js";

export const salesRouter = Router();

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

  next();
}

// GET /api/sales — List sales
salesRouter.get("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const productId = req.query.productId as string;

    const where: any = { businessId };
    if (productId) where.productId = productId;

    const sales = await prisma.salesRecord.findMany({
      where,
      include: { product: true },
      orderBy: { date: "desc" },
      take: 100,
    });

    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/sales — Record sale
salesRouter.post("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { businessId, productId, quantitySold, unitPrice, wasStockoutSuppressed, channel = "in_store", date } = req.body;

    if (!productId || quantitySold === undefined) {
      res.status(400).json({ success: false, error: { message: "productId and quantitySold are required." } });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ success: false, error: { message: "Product not found." } });
      return;
    }

    const qty = Number(quantitySold);
    const price = unitPrice !== undefined ? Number(unitPrice) : product.sellingPrice;
    const totalAmount = qty * price;

    const record = await prisma.salesRecord.create({
      data: {
        businessId,
        productId,
        date: date ? new Date(date) : new Date(),
        quantitySold: qty,
        unitPrice: price,
        totalAmount,
        wasStockoutSuppressed: Boolean(wasStockoutSuppressed),
        channel,
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/sales/forecast/:productId — Run statistical demand forecast
salesRouter.get("/forecast/:productId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId;
    const planningHorizonDays = parseInt(req.query.horizon as string, 10) || 30;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        salesRecords: { orderBy: { date: "desc" }, take: 90 },
        supplierQuotes: { orderBy: { quotedUnitCost: "asc" }, take: 1 },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, error: { message: "Product not found." } });
      return;
    }

    const leadTimeDays = product.supplierQuotes?.[0]?.leadTimeDays || 3;

    const salesHistory = product.salesRecords.map((s) => ({
      date: s.date.toISOString(),
      quantitySold: s.quantitySold,
      unitPrice: s.unitPrice,
      wasStockoutSuppressed: s.wasStockoutSuppressed,
    }));

    const forecast = DemandForecastService.calculateForecast({
      salesHistory,
      currentStock: product.stockOnHand,
      leadTimeDays,
      planningHorizonDays,
      targetServiceLevel: 0.95,
      unitCost: product.purchasePrice,
      sellingPrice: product.sellingPrice,
    });

    res.json({
      success: true,
      data: {
        product,
        forecast,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
