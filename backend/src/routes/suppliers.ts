import { Router, Response } from "express";
import { prisma } from "../index.js";
import { AuthRequest } from "../middleware/auth.js";

export const suppliersRouter = Router();

// Middleware helper
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

// GET /api/suppliers
suppliersRouter.get("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.query.businessId as string;
    const suppliers = await prisma.supplier.findMany({
      where: { businessId },
      include: {
        quotes: {
          include: { product: true },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/suppliers
suppliersRouter.post("/", (req, res, next) => checkBusinessAccess(req as AuthRequest, res, next), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessId,
      name,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms = "Net 30",
      defaultLeadTimeDays = 3,
      notes,
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, error: { message: "Supplier name is required." } });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: {
        businessId,
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        paymentTerms,
        defaultLeadTimeDays: Math.max(1, parseInt(defaultLeadTimeDays, 10) || 3),
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});

// POST /api/suppliers/:id/quotes — Add product quote
suppliersRouter.post("/:id/quotes", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplierId = req.params.id as string;
    const { productId, quotedUnitCost, quotedPackCost, minOrderQuantity = 1, leadTimeDays = 3, isPreferred = false } = req.body;

    if (!supplierId || !productId || quotedUnitCost === undefined) {
      res.status(400).json({ success: false, error: { message: "supplierId, productId, and quotedUnitCost are required." } });
      return;
    }

    const quote = await prisma.supplierQuote.create({
      data: {
        supplierId,
        productId,
        quotedUnitCost: Number(quotedUnitCost),
        quotedPackCost: quotedPackCost !== undefined ? Number(quotedPackCost) : null,
        minOrderQuantity: Math.max(1, parseInt(minOrderQuantity, 10)),
        leadTimeDays: Math.max(1, parseInt(leadTimeDays, 10)),
        isPreferred: Boolean(isPreferred),
      },
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: (error as Error).message } });
  }
});
