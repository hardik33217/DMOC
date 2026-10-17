import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateWorkflowNodeSchema, UpdateWorkflowNodeSchema, CreateWorkflowEdgeSchema, UpdateWorkflowEdgeSchema } from "@decisionos/shared";
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

  const nodes = await prisma.workflowNode.findMany({
    where: { workflowId },
    orderBy: { createdAt: "asc" },
  });

  res.json(createApiResponse(nodes));
}));

router.get("/:nodeId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, nodeId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const node = await prisma.workflowNode.findFirst({ where: { id: nodeId, workflowId } });
  if (!node) {
    res.status(404).json(createApiError("NOT_FOUND", "Node not found"));
    return;
  }

  res.json(createApiResponse(node));
}));

router.post("/", validateParams(uuidParamSchema), validateBody(CreateWorkflowNodeSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId } = req.params;
  const userId = req.user!.id;
  const { type, title, description, positionX, positionY, width, height, config, schemaVersion } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const node = await prisma.workflowNode.create({
    data: {
      workflowId: workflowId as string,
      type,
      title,
      description,
      positionX,
      positionY,
      width,
      height,
      config: JSON.stringify(config),
      schemaVersion,
    },
  });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.status(201).json(createApiResponse({ ...node, config: JSON.parse(node.config) }));
}));

router.patch("/:nodeId", validateParams(uuidParamSchema), validateBody(UpdateWorkflowNodeSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, nodeId } = req.params;
  const userId = req.user!.id;
  const { type, title, description, positionX, positionY, width, height, config, schemaVersion } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const node = await prisma.workflowNode.findFirst({ where: { id: nodeId, workflowId } });
  if (!node) {
    res.status(404).json(createApiError("NOT_FOUND", "Node not found"));
    return;
  }

  const updated = await prisma.workflowNode.update({
    where: { id: nodeId },
    data: {
      type: type ?? node.type,
      title: title ?? node.title,
      description: description ?? node.description,
      positionX: positionX ?? node.positionX,
      positionY: positionY ?? node.positionY,
      width: width ?? node.width,
      height: height ?? node.height,
      config: config !== undefined ? JSON.stringify(config) : node.config,
      schemaVersion: schemaVersion ?? node.schemaVersion,
    },
  });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.json(createApiResponse({ ...updated, config: JSON.parse(updated.config) }));
}));

router.delete("/:nodeId", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { workflowId, nodeId } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const node = await prisma.workflowNode.findFirst({ where: { id: nodeId, workflowId } });
  if (!node) {
    res.status(404).json(createApiError("NOT_FOUND", "Node not found"));
    return;
  }

  await prisma.workflowNode.delete({ where: { id: nodeId } });

  await prisma.workflow.update({ where: { id: workflowId }, data: { version: workflow.version + 1 } });

  res.json(createApiResponse({ message: "Node deleted" }));
}));

export { router as workflowNodesRouter };