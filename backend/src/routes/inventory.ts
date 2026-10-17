import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";

export const inventoryRouter = Router();

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

// GET /api/inventory/movements — Stock movement history
inventoryRouter.get("/movements", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const productId = req.query.productId as string;

    const where: any = {
      product: { businessId },
    };

    if (productId) {
      where.productId = productId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory/movements — Record stock movement
inventoryRouter.post("/movements", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, type, quantity, reason, unitCost } = req.body;

    if (!productId || !type || quantity === undefined) {
      res.status(400).json({ success: false, error: { message: "productId, type, and quantity are required." } });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ success: false, error: { message: "Product not found." } });
      return;
    }

    const qty = Number(quantity);
    let delta = qty;
    if (type === "sale" || type === "waste_spoilage") {
      delta = -Math.abs(qty);
    } else if (type === "purchase" || type === "return") {
      delta = Math.abs(qty);
    }

    // Run transaction: create movement record and update product stock
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: qty,
          unitCost: unitCost !== undefined ? Number(unitCost) : product.purchasePrice,
          reason: reason || null,
          performedBy: req.user!.email,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockOnHand: {
            increment: delta,
          },
        },
      });

      return { movement, updatedProduct };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/inventory/bulk-refill — Refill multiple products to requirements in a single transaction
inventoryRouter.post("/bulk-refill", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, reason = "Stock replenishment" } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { message: "items array is required" } });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const { productId, quantity } = item;
        const qty = Number(quantity);
        if (!productId || qty <= 0) continue;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) continue;

        const movement = await tx.stockMovement.create({
          data: {
            productId,
            type: "purchase",
            quantity: qty,
            unitCost: product.purchasePrice,
            reason: reason || "Replenishment to target stock level",
            performedBy: req.user!.email,
          },
        });

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stockOnHand: { increment: qty },
          },
        });

        results.push({ movement, updatedProduct });
      }
      return results;
    });

    res.json({ success: true, data: { count: updated.length, updated } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// GET /api/inventory/alerts — Stockout, low stock, near-expiry alerts
inventoryRouter.get("/alerts", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      include: {
        supplierQuotes: {
          include: { supplier: true },
          take: 1,
        },
      },
    });

    const stockouts = products.filter((p) => p.stockOnHand <= 0);
    const lowStock = products.filter((p) => p.stockOnHand > 0 && p.stockOnHand <= p.reorderPoint);
    const nearExpiry = products.filter((p) => p.expiryDate && new Date(p.expiryDate) <= thirtyDays);

    res.json({
      success: true,
      data: {
        stockouts,
        lowStock,
        nearExpiry,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
