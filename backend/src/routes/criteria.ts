import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateCriterionSchema, UpdateCriterionSchema, CriterionDirection } from "@decisionos/shared";
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

  const criteria = await prisma.criterion.findMany({
    where: { decisionId },
    orderBy: { order: "asc" },
  });

  return res.json(createApiResponse(criteria));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const criterion = await prisma.criterion.findFirst({ where: { id, decisionId } });
  if (!criterion) {
    return res.status(404).json(createApiError("NOT_FOUND", "Criterion not found"));
  }

  return res.json(createApiResponse(criterion));
}));

router.post("/", validateBody(CreateCriterionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { name, description, weight, direction, order } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const maxOrder = await prisma.criterion.findFirst({
    where: { decisionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const criterion = await prisma.criterion.create({
    data: {
      decisionId: decisionId!,
      name,
      description,
      weight,
      direction: direction ?? "maximize",
      order: order ?? (maxOrder?.order ?? -1) + 1,
    },
  });

  return res.status(201).json(createApiResponse(criterion));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(UpdateCriterionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { name, description, weight, direction, order } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const criterion = await prisma.criterion.findFirst({ where: { id, decisionId } });
  if (!criterion) {
    return res.status(404).json(createApiError("NOT_FOUND", "Criterion not found"));
  }

  const updated = await prisma.criterion.update({
    where: { id },
    data: { name: name ?? criterion.name, description: description ?? criterion.description, weight: weight ?? criterion.weight, direction: direction ?? criterion.direction, order: order ?? criterion.order },
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

  const criterion = await prisma.criterion.findFirst({ where: { id, decisionId } });
  if (!criterion) {
    return res.status(404).json(createApiError("NOT_FOUND", "Criterion not found"));
  }

  await prisma.criterion.delete({ where: { id } });

  return res.json(createApiResponse({ message: "Criterion deleted" }));
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
    items.map((item: { id: string; order: number }) => prisma.criterion.update({ where: { id: item.id }, data: { order: item.order } }))
  );

  return res.json(createApiResponse({ message: "Criteria reordered" }));
}));

export { router as criteriaRouter };