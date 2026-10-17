import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateWorkflowEdgeSchema, UpdateWorkflowEdgeSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router({ mergeParams: true });

router.get("/", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const edges = await prisma.workflowEdge.findMany({
    where: { workflowId },
    orderBy: { createdAt: "asc" },
  });

  res.json(createApiResponse(edges));
}));

router.post("/", validateParams(uuidParamSchema), validateBody(CreateWorkflowEdgeSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const userId = req.user!.id;
  const { sourceNodeId, targetNodeId, sourceHandle, targetHandle, label } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const sourceNode = await prisma.workflowNode.findFirst({ where: { id: sourceNodeId, workflowId } });
  const targetNode = await prisma.workflowNode.findFirst({ where: { id: targetNodeId, workflowId } });
  if (!sourceNode || !targetNode) {
    res.status(404).json(createApiError("NOT_FOUND", "Source or target node not found"));
    return;
  }

  const edge = await prisma.workflowEdge.create({
    data: {
      workflowId: workflowId as string,
      sourceNodeId,
      targetNodeId,
      sourceHandle,
      targetHandle,
      label,
    },
  });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.status(201).json(createApiResponse(edge));
}));

router.patch("/:edgeId", validateParams(uuidParamSchema), validateBody(UpdateWorkflowEdgeSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, edgeId } = req.params;
  const userId = req.user!.id;
  const { sourceNodeId, targetNodeId, sourceHandle, targetHandle, label } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const edge = await prisma.workflowEdge.findFirst({ where: { id: edgeId, workflowId } });
  if (!edge) {
    res.status(404).json(createApiError("NOT_FOUND", "Edge not found"));
    return;
  }

  if (sourceNodeId || targetNodeId) {
    if (sourceNodeId) {
      const sourceNode = await prisma.workflowNode.findFirst({ where: { id: sourceNodeId, workflowId } });
      if (!sourceNode) {
        res.status(404).json(createApiError("NOT_FOUND", "Source node not found"));
        return;
      }
    }
    if (targetNodeId) {
      const targetNode = await prisma.workflowNode.findFirst({ where: { id: targetNodeId, workflowId } });
      if (!targetNode) {
        res.status(404).json(createApiError("NOT_FOUND", "Target node not found"));
        return;
      }
    }
  }

  const updated = await prisma.workflowEdge.update({
    where: { id: edgeId },
    data: {
      sourceNodeId: sourceNodeId ?? edge.sourceNodeId,
      targetNodeId: targetNodeId ?? edge.targetNodeId,
      sourceHandle: sourceHandle ?? edge.sourceHandle,
      targetHandle: targetHandle ?? edge.targetHandle,
      label: label ?? edge.label,
    },
  });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.json(createApiResponse(updated));
}));

router.delete("/:edgeId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, edgeId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const edge = await prisma.workflowEdge.findFirst({ where: { id: edgeId, workflowId } });
  if (!edge) {
    res.status(404).json(createApiError("NOT_FOUND", "Edge not found"));
    return;
  }

  await prisma.workflowEdge.delete({ where: { id: edgeId } });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.json(createApiResponse({ message: "Edge deleted" }));
}));

export { router as workflowEdgesRouter };