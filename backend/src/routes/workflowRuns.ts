import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, validateQuery, uuidParamSchema, paginationSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, RunWorkflowSchema, WorkflowRunStatusSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { executeWorkflow } from "../services/workflowExecutor.js";

const router = Router({ mergeParams: true });

router.get("/", validateParams(uuidParamSchema), validateQuery(z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(50).default(20) })), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const userId = req.user!.id;
  const { page = "1", limit = "20" } = req.query as Record<string, string | undefined>;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const [runs, total] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: { nodeResults: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.workflowRun.count({ where: { workflowId } }),
  ]);

  res.json(createApiResponse(runs, { page: parseInt(page), limit: parseInt(limit), total }));
}));

router.get("/:runId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, runId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const run = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId },
    include: { nodeResults: { orderBy: { createdAt: "asc" } } },
  });

  if (!run) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow run not found"));
    return;
  }

  res.json(createApiResponse(run));
}));

router.post("/run", validateParams(uuidParamSchema), validateBody(RunWorkflowSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const userId = req.user!.id;
  const { inputData } = req.body;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ownerId: userId },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  if (workflow.nodes.length === 0) {
    res.status(400).json(createApiError("VALIDATION_ERROR", "Workflow has no nodes"));
    return;
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflowId as string,
      status: "running",
      startedAt: new Date(),
      inputSnapshot: inputData ? JSON.stringify(inputData) : null,
    },
  });

  try {
    const result = await executeWorkflow(workflow, inputData || {}, run.id);

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: result.status,
        completedAt: new Date(),
        outputSnapshot: JSON.stringify(result.outputData),
      },
    });

    const completedRun = await prisma.workflowRun.findUnique({
      where: { id: run.id },
      include: { nodeResults: { orderBy: { createdAt: "asc" } } },
    });

    res.json(createApiResponse(completedRun));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}));

router.post("/:runId/rerun", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, runId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ownerId: userId },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const previousRun = await prisma.workflowRun.findFirst({
    where: { id: runId, workflowId },
    include: { nodeResults: true },
  });

  if (!previousRun) {
    res.status(404).json(createApiError("NOT_FOUND", "Previous run not found"));
    return;
  }

  const inputData = previousRun.inputSnapshot ? JSON.parse(previousRun.inputSnapshot) : {};

  const newRun = await prisma.workflowRun.create({
    data: {
      workflowId: workflowId as string,
      status: "running",
      startedAt: new Date(),
      inputSnapshot: previousRun.inputSnapshot,
    },
  });

  try {
    const result = await executeWorkflow(workflow, inputData, newRun.id);

    await prisma.workflowRun.update({
      where: { id: newRun.id },
      data: {
        status: result.status,
        completedAt: new Date(),
        outputSnapshot: JSON.stringify(result.outputData),
      },
    });

    const completedRun = await prisma.workflowRun.findUnique({
      where: { id: newRun.id },
      include: { nodeResults: { orderBy: { createdAt: "asc" } } },
    });

    res.json(createApiResponse(completedRun));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.workflowRun.update({
      where: { id: newRun.id },
      data: {
        status: "failed",
        error: errorMessage,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}));

router.delete("/:runId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, runId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const run = await prisma.workflowRun.findFirst({ where: { id: runId, workflowId } });
  if (!run) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow run not found"));
    return;
  }

  await prisma.workflowRun.delete({ where: { id: runId } });

  res.json(createApiResponse({ message: "Workflow run deleted" }));
}));

export { router as workflowRunsRouter };