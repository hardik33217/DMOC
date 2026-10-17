import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateQuery, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, RunSimulationSchema, SimulationStatus } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { calculateWeightedScores, prepareSimulationInput, runMonteCarlo, runSensitivityAnalysis, generateExplanation, rankAlternativesByAlgorithm } from "../services/decisionEngine.js";

const router = Router({ mergeParams: true });

router.post("/run", validateBody(RunSimulationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { scenarioId, algorithm, iterations, seed } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, decisionId } });
  if (!scenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Scenario not found"));
  }

  const [alternatives, criteria, scenarioInputs] = await Promise.all([
    prisma.alternative.findMany({ where: { decisionId }, include: { outcomes: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } }),
    prisma.criterion.findMany({ where: { decisionId }, orderBy: { order: "asc" } }),
    prisma.scenarioInput.findMany({ where: { scenarioId } }),
  ]);

  if (alternatives.length === 0) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "No alternatives defined"));
  }

  const criterionScores: Record<string, Record<string, number>> = {};
  for (const criterion of criteria) {
    const criterionScoreMap: Record<string, number> = {};
    criterionScores[criterion.id] = criterionScoreMap;
    for (const alt of alternatives) {
      const input = scenarioInputs.find((i: { entityType: string; entityId: string; field: string; scenarioId: string; value: string }) => i.entityType === "criterion" && i.entityId === criterion.id && (i.field === `score_${alt.id}` || i.field === "score") && i.scenarioId === scenarioId);
      const baseValue = input ? parseFloat(input.value) : 50;
      criterionScoreMap[alt.id] = baseValue;
    }
  }

  for (const input of scenarioInputs) {
    if (input.entityType === "alternative" && input.field === "title") {
      // Title changes don't affect scores
    } else if (input.entityType === "outcome" && (input.field === "probability" || input.field === "monetaryPayoff" || input.field === "utilityScore")) {
      // Outcome changes are handled in the engine via scenario inputs
    }
  }

  const simulationRun = await prisma.simulationRun.create({
    data: {
      scenarioId,
      algorithmVersion: algorithm,
      inputSnapshot: JSON.stringify({ criterionScores, scenarioInputs: scenarioInputs.map((i: { entityType: string; entityId: string; field: string; value: string }) => ({ entityType: i.entityType, entityId: i.entityId, field: i.field, value: i.value })) }),
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    let results: Awaited<ReturnType<typeof calculateWeightedScores>>;

    if (algorithm === "monte_carlo") {
      const simInput = prepareSimulationInput(alternatives as any, criteria as any, criterionScores);
      results = runMonteCarlo(simInput, iterations, seed);
    } else {
      results = calculateWeightedScores({ alternatives, criteria } as any, criterionScores);
    }

    results = rankAlternativesByAlgorithm(results, algorithm);

    const altMap = new Map(alternatives.map((a: { id: string; title: string }) => [a.id, a]));
    const savedResults = await Promise.all(results.map(async (r, index) => {
      const created = await prisma.simulationResult.create({
        data: {
          simulationRunId: simulationRun.id,
          alternativeId: r.alternativeId,
          weightedScore: r.weightedScore,
          expectedMonetaryValue: r.expectedMonetaryValue,
          expectedUtility: r.expectedUtility,
          bestCase: r.bestCase,
          worstCase: r.worstCase,
          riskMetrics: JSON.stringify(r.riskMetrics),
          sensitivityData: JSON.stringify(r.details),
          rank: index + 1,
          details: JSON.stringify(r.details),
        },
      });
      return {
        ...created,
        alternativeTitle: r.alternativeTitle || altMap.get(r.alternativeId)?.title || "Alternative",
        alternative: altMap.get(r.alternativeId),
      };
    }));

    await prisma.simulationRun.update({
      where: { id: simulationRun.id },
      data: { status: "completed", completedAt: new Date() },
    });

    const explanation = generateExplanation(results, { alternatives, criteria } as any);

    return res.json(createApiResponse({
      simulationRun: { ...simulationRun, status: "completed", completedAt: new Date() },
      results: savedResults,
      explanation,
    }));
  } catch (error) {
    await prisma.simulationRun.update({
      where: { id: simulationRun.id },
      data: { status: "failed", error: error instanceof Error ? error.message : "Unknown error", completedAt: new Date() },
    });
    throw error;
  }
}));

router.get("/runs", validateQuery(z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(50).default(20) })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { page = "1", limit = "20" } = req.query as Record<string, string | undefined>;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const scenarioIds = (await prisma.scenario.findMany({ where: { decisionId }, select: { id: true } })).map((s: { id: string }) => s.id);

  const [runs, total] = await Promise.all([
    prisma.simulationRun.findMany({
      where: { scenarioId: { in: scenarioIds } },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { results: { include: { alternative: true } }, scenario: true },
    }),
    prisma.simulationRun.count({ where: { scenarioId: { in: scenarioIds } } }),
  ]);

  return res.json(createApiResponse(runs, { page: parseInt(page), limit: parseInt(limit), total }));
}));

router.get("/runs/:runId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, runId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const run = await prisma.simulationRun.findFirst({
    where: { id: runId, scenario: { decisionId } },
    include: { results: { include: { alternative: true } }, scenario: true },
  });

  if (!run) {
    return res.status(404).json(createApiError("NOT_FOUND", "Simulation run not found"));
  }

  return res.json(createApiResponse(run));
}));

router.post("/compare", validateBody(z.object({ baselineScenarioId: z.string().uuid(), scenarioIds: z.array(z.string().uuid()).min(1).max(5) })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { baselineScenarioId, scenarioIds } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const [baselineScenario, scenarios] = await Promise.all([
    prisma.scenario.findFirst({
      where: { id: baselineScenarioId, decisionId },
      include: {
        simulationRuns: {
          where: { status: "completed" },
          include: { results: { include: { alternative: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.scenario.findMany({
      where: { id: { in: scenarioIds }, decisionId },
      include: {
        simulationRuns: {
          where: { status: "completed" },
          include: { results: { include: { alternative: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  if (!baselineScenario) {
    return res.status(404).json(createApiError("NOT_FOUND", "Baseline scenario not found"));
  }

  const baselineRun = baselineScenario.simulationRuns[0];
  const scenarioRuns = scenarios.map((s: { simulationRuns: Array<{ id: string }> }) => ({ scenario: s, run: s.simulationRuns[0] })).filter((s: { run: { id: string } | undefined }) => s.run);

  if (!baselineRun) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "Baseline scenario has no completed simulation"));
  }

  return res.json(createApiResponse({
    baseline: { run: baselineRun, scenario: baselineScenario },
    scenarios: scenarioRuns.map(({ scenario, run }: any) => ({ scenario, run })),
  }));
}));

router.post("/sensitivity", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  let baselineScenario = await prisma.scenario.findFirst({
    where: { decisionId, isBaseline: true },
    include: {
      simulationRuns: {
        where: { status: "completed" },
        include: { results: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!baselineScenario) {
    const created = await prisma.scenario.create({
      data: {
        decisionId: decisionId!,
        name: "Baseline",
        description: "Original assumptions",
        isBaseline: true,
      },
    });
    baselineScenario = {
      ...created,
      simulationRuns: [],
    };
  }

  const [alternatives, criteria] = await Promise.all([
    prisma.alternative.findMany({ where: { decisionId }, include: { outcomes: true }, orderBy: { order: "asc" } }),
    prisma.criterion.findMany({ where: { decisionId }, orderBy: { order: "asc" } }),
  ]);

  if (alternatives.length === 0) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "No alternatives defined"));
  }

  const criterionScores: Record<string, Record<string, number>> = {};
  for (const criterion of criteria) {
    const criterionScoreMap: Record<string, number> = {};
    criterionScores[criterion.id] = criterionScoreMap;
    for (const alt of alternatives) {
      criterionScoreMap[alt.id] = 50;
    }
  }

  const baselineResults = calculateWeightedScores({ alternatives, criteria } as any, criterionScores);

  if (!baselineScenario.simulationRuns || baselineScenario.simulationRuns.length === 0) {
    const run = await prisma.simulationRun.create({
      data: {
        scenarioId: baselineScenario.id,
        algorithmVersion: "weighted",
        inputSnapshot: JSON.stringify({ criterionScores }),
        status: "completed",
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
    await Promise.all(baselineResults.map((r, idx) => prisma.simulationResult.create({
      data: {
        simulationRunId: run.id,
        alternativeId: r.alternativeId,
        weightedScore: r.weightedScore,
        expectedMonetaryValue: r.expectedMonetaryValue,
        expectedUtility: r.expectedUtility,
        bestCase: r.bestCase,
        worstCase: r.worstCase,
        riskMetrics: JSON.stringify(r.riskMetrics),
        sensitivityData: JSON.stringify(r.details),
        rank: idx + 1,
        details: JSON.stringify(r.details),
      },
    })));
  }

  const sensitivity = runSensitivityAnalysis({ alternatives, criteria } as any, criterionScores, baselineResults);

  return res.json(createApiResponse({ sensitivity }));
}));

export { router as simulationsRouter };