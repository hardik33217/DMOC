import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateAlternativeSchema, UpdateAlternativeSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router({ mergeParams: true });

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), order: z.number().int().nonnegative() })),
});

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const alternatives = await prisma.alternative.findMany({
    where: { decisionId },
    orderBy: { order: "asc" },
    include: { outcomes: { orderBy: { order: "asc" } } },
  });

  return res.json(createApiResponse(alternatives));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const alternative = await prisma.alternative.findFirst({
    where: { id, decisionId },
    include: { outcomes: { orderBy: { order: "asc" } } },
  });

  if (!alternative) {
    return res.status(404).json(createApiError("NOT_FOUND", "Alternative not found"));
  }

  return res.json(createApiResponse(alternative));
}));

router.post("/", validateBody(CreateAlternativeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { title, description, order } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const maxOrder = await prisma.alternative.findFirst({
    where: { decisionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const alternative = await prisma.alternative.create({
    data: {
      decisionId: decisionId!,
      title,
      description,
      order: order ?? (maxOrder?.order ?? -1) + 1,
    },
  });

  return res.status(201).json(createApiResponse(alternative));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(UpdateAlternativeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { title, description, order } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const alternative = await prisma.alternative.findFirst({ where: { id, decisionId } });
  if (!alternative) {
    return res.status(404).json(createApiError("NOT_FOUND", "Alternative not found"));
  }

  const updated = await prisma.alternative.update({
    where: { id },
    data: { title: title ?? alternative.title, description: description ?? alternative.description, order: order ?? alternative.order },
  });

  return res.json(createApiResponse(updated));
}));

router.delete("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const alternative = await prisma.alternative.findFirst({ where: { id, decisionId } });
  if (!alternative) {
    return res.status(404).json(createApiError("NOT_FOUND", "Alternative not found"));
  }

  await prisma.alternative.delete({ where: { id } });

  return res.json(createApiResponse({ message: "Alternative deleted" }));
}));

router.post("/reorder", validateBody(reorderSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { items } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  await prisma.$transaction(
    items.map((item: { id: string; order: number }) => prisma.alternative.update({ where: { id: item.id }, data: { order: item.order } }))
  );

  return res.json(createApiResponse({ message: "Alternatives reordered" }));
}));

export { router as alternativesRouter };