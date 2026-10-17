import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateQuery, validateParams, uuidParamSchema, paginationSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, DecisionStatusSchema, DecisionCategorySchema, CreateDecisionSchema, UpdateDecisionSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { DECISION_TEMPLATES } from "../templates.js";

const router = Router();

const decisionFilterSchema = z.object({
  status: DecisionStatusSchema.optional(),
  category: DecisionCategorySchema.optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
}).merge(paginationSchema);

router.get("/", validateQuery(decisionFilterSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = "1", limit = "20", sortBy, sortOrder, status, category, search, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const userId = req.user!.id;

  const where: Record<string, unknown> = { ownerId: userId };
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }, { question: { contains: search, mode: "insensitive" } }];
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
  }

  const [decisions, total] = await Promise.all([
    prisma.decision.findMany({
      where,
      orderBy: { [sortBy || "updatedAt"]: sortOrder || "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        _count: { select: { alternatives: true, criteria: true, outcomes: true, scenarios: true } },
      },
    }),
    prisma.decision.count({ where }),
  ]);

  res.json(createApiResponse(decisions, { page: parseInt(page), limit: parseInt(limit), total }));
}));

router.get("/stats", asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [totalDecisions, activeDecisions, savedScenarios, recentDecisions] = await Promise.all([
    prisma.decision.count({ where: { ownerId: userId } }),
    prisma.decision.count({ where: { ownerId: userId, status: "active" } }),
    prisma.scenario.count({ where: { decision: { ownerId: userId } } }),
    prisma.decision.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true, category: true, question: true },
    }),
  ]);

  res.json(createApiResponse({ totalDecisions, activeDecisions, savedScenarios, recentDecisions }));
}));

router.get("/templates", asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json(createApiResponse(DECISION_TEMPLATES));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({
    where: { id, ownerId: userId },
    include: {
      alternatives: { orderBy: { order: "asc" }, include: { outcomes: { orderBy: { order: "asc" } } } },
      criteria: { orderBy: { order: "asc" } },
      scenarios: { where: { isBaseline: false }, orderBy: { createdAt: "desc" } },
      _count: { select: { alternatives: true, criteria: true, outcomes: true, scenarios: true } },
    },
  });

  if (!decision) {
    res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
    return;
  }

  res.json(createApiResponse(decision));
}));

router.post("/", validateBody(CreateDecisionSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title, description, category, question, deadline } = req.body;

  const decision = await prisma.decision.create({
    data: {
      ownerId: userId,
      title,
      description,
      category,
      question,
      deadline: deadline ? new Date(deadline) : null,
      status: "draft",
    },
  });

  await prisma.auditEvent.create({
    data: { actorId: userId, action: "create", entityType: "Decision", entityId: decision.id, metadata: JSON.stringify({ title, category }) },
  });

  res.status(201).json(createApiResponse(decision));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(UpdateDecisionSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title, description, category, question, deadline, status } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id, ownerId: userId } });
  if (!decision) {
    res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
    return;
  }

  const updated = await prisma.decision.update({
    where: { id },
    data: {
      title: title ?? decision.title,
      description: description ?? decision.description,
      category: category ?? decision.category,
      question: question ?? decision.question,
      deadline: deadline ? new Date(deadline) : decision.deadline,
      status: status ?? decision.status,
    },
  });

  res.json(createApiResponse(updated));
}));

router.delete("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id, ownerId: userId } });
  if (!decision) {
    res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
    return;
  }

  await prisma.decision.delete({ where: { id } });

  res.json(createApiResponse({ message: "Decision deleted" }));
}));

router.post("/:id/duplicate", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({
    where: { id, ownerId: userId },
    include: { alternatives: { include: { outcomes: true } }, criteria: true },
  });

  if (!decision) {
    res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
    return;
  }

  const duplicated = await prisma.$transaction(async (tx: any) => {
    const newDecision = await tx.decision.create({
      data: {
        ownerId: userId,
        title: `${decision.title} (Copy)`,
        description: decision.description,
        category: decision.category,
        question: decision.question,
        deadline: decision.deadline,
        status: "draft",
      },
    });

    const altMap = new Map<string, string>();
    for (const alt of decision.alternatives) {
      const newAlt = await tx.alternative.create({
        data: { decisionId: newDecision.id, title: alt.title, description: alt.description, order: alt.order },
      });
      altMap.set(alt.id, newAlt.id);

      for (const outcome of alt.outcomes) {
        await tx.outcome.create({
          data: {
            alternativeId: newAlt.id,
            title: outcome.title,
            description: outcome.description,
            probability: outcome.probability,
            monetaryPayoff: outcome.monetaryPayoff,
            utilityScore: outcome.utilityScore,
            riskLevel: outcome.riskLevel,
            order: outcome.order,
          },
        });
      }
    }

    for (const criterion of decision.criteria) {
      await tx.criterion.create({
        data: {
          decisionId: newDecision.id,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          direction: criterion.direction,
          order: criterion.order,
        },
      });
    }

    return newDecision;
  });

  res.status(201).json(createApiResponse(duplicated));
}));

export { router as decisionsRouter };