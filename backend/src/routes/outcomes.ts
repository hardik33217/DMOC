import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateOutcomeSchema, UpdateOutcomeSchema, RiskLevel } from "@decisionos/shared";
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
    include: { outcomes: { orderBy: { order: "asc" } } },
  });

  const outcomes = alternatives.flatMap((alt: any) => alt.outcomes.map((o: any) => ({ ...o, alternativeId: alt.id, alternativeTitle: alt.title })));
  return res.json(createApiResponse(outcomes));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const outcome = await prisma.outcome.findFirst({
    where: { id, alternative: { decisionId } },
    include: { alternative: true },
  });

  if (!outcome) {
    return res.status(404).json(createApiError("NOT_FOUND", "Outcome not found"));
  }

  return res.json(createApiResponse(outcome));
}));

router.post("/", validateBody(CreateOutcomeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { title, description, probability, monetaryPayoff, utilityScore, riskLevel, order, alternativeId } = req.body;

  if (!alternativeId) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "alternativeId is required"));
  }

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const alternative = await prisma.alternative.findFirst({ where: { id: alternativeId, decisionId } });
  if (!alternative) {
    return res.status(404).json(createApiError("NOT_FOUND", "Alternative not found"));
  }

  const maxOrder = await prisma.outcome.findFirst({
    where: { alternativeId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const outcome = await prisma.outcome.create({
    data: {
      alternativeId,
      decisionId: decisionId!,
      title,
      description,
      probability,
      monetaryPayoff,
      utilityScore,
      riskLevel: riskLevel ?? "low",
      order: order ?? (maxOrder?.order ?? -1) + 1,
    },
  });

  return res.status(201).json(createApiResponse(outcome));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(UpdateOutcomeSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { title, description, probability, monetaryPayoff, utilityScore, riskLevel, order } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const outcome = await prisma.outcome.findFirst({ where: { id, alternative: { decisionId } } });
  if (!outcome) {
    return res.status(404).json(createApiError("NOT_FOUND", "Outcome not found"));
  }

  const updated = await prisma.outcome.update({
    where: { id },
    data: {
      title: title ?? outcome.title,
      description: description ?? outcome.description,
      probability: probability ?? outcome.probability,
      monetaryPayoff: monetaryPayoff ?? outcome.monetaryPayoff,
      utilityScore: utilityScore ?? outcome.utilityScore,
      riskLevel: riskLevel ?? outcome.riskLevel,
      order: order ?? outcome.order,
    },
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

  const outcome = await prisma.outcome.findFirst({ where: { id, alternative: { decisionId } } });
  if (!outcome) {
    return res.status(404).json(createApiError("NOT_FOUND", "Outcome not found"));
  }

  await prisma.outcome.delete({ where: { id } });

  return res.json(createApiResponse({ message: "Outcome deleted" }));
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
    items.map((item: { id: string; order: number }) => prisma.outcome.update({ where: { id: item.id }, data: { order: item.order } }))
  );

  return res.json(createApiResponse({ message: "Outcomes reordered" }));
}));

export { router as outcomesRouter };