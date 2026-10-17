import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateScenarioSchema, UpdateScenarioInputSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenarios = await prisma.scenario.findMany({
    where: { decisionId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { inputs: true, simulationRuns: true } } },
  });

  return res.json(createApiResponse(scenarios));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({
    where: { id, decisionId },
    include: { inputs: true, simulationRuns: { include: { results: true }, orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  return res.json(createApiResponse(scenario));
}));

router.post("/", validateBody(CreateScenarioSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { name, description, parentScenarioId } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  let isBaseline = false;
  if (!parentScenarioId) {
    const existingBaseline = await prisma.scenario.findFirst({ where: { decisionId, isBaseline: true } });
    if (!existingBaseline) isBaseline = true;
  }

  const scenario = await prisma.scenario.create({
    data: {
      decisionId: decisionId!,
      name,
      description,
      isBaseline,
      parentScenarioId,
    },
  });

  return res.status(201).json(createApiResponse(scenario));
}));

router.post("/:id/duplicate", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const sourceScenario = await prisma.scenario.findFirst({ where: { id, decisionId }, include: { inputs: true } });
  if (!sourceScenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  const duplicated = await prisma.scenario.create({
    data: {
      decisionId: decisionId!,
      name: `${sourceScenario.name} (Copy)`,
      description: sourceScenario.description,
      isBaseline: false,
      parentScenarioId: sourceScenario.id,
      inputs: { create: sourceScenario.inputs.map((i: { entityType: string; entityId: string; field: string; value: string }) => ({ entityType: i.entityType, entityId: i.entityId, field: i.field, value: i.value })) },
    },
    include: { inputs: true },
  });

  return res.status(201).json(createApiResponse(duplicated));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(z.object({ name: z.string().min(1).max(200).optional(), description: z.string().max(2000).optional() })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { name, description } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({ where: { id, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  const updated = await prisma.scenario.update({
    where: { id },
    data: { name: name ?? scenario.name, description: description ?? scenario.description },
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

  const scenario = await prisma.scenario.findFirst({ where: { id, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  if (scenario.isBaseline) {
    return res.status(400).json(createApiError("FORBIDDEN", "Cannot delete baseline scenario"));
  }

  await prisma.scenario.delete({ where: { id } });

  return res.json(createApiResponse({ message: "Scenario deleted" }));
}));

router.post("/:id/inputs", validateParams(uuidParamSchema), validateBody(UpdateScenarioInputSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { entityType, entityId, field, value } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({ where: { id, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  const input = await prisma.scenarioInput.upsert({
    where: { scenarioId_entityType_entityId_field: { scenarioId: id!, entityType, entityId, field } },
    update: { value: String(value) },
    create: { scenarioId: id!, entityType, entityId, field, value: String(value) },
  });

  return res.json(createApiResponse(input));
}));

router.delete("/:id/inputs", validateParams(uuidParamSchema), validateBody(z.object({ entityType: z.string(), entityId: z.string().uuid(), field: z.string() })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;
  const { entityType, entityId, field } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({ where: { id, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  await prisma.scenarioInput.delete({ where: { scenarioId_entityType_entityId_field: { scenarioId: id!, entityType, entityId, field } } });

  return res.json(createApiResponse({ message: "Input removed" }));
}));

router.post("/:id/reset", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({ where: { id, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  await prisma.scenarioInput.deleteMany({ where: { scenarioId: id } });

  return res.json(createApiResponse({ message: "Scenario reset to baseline" }));
}));

export { router as scenariosRouter };