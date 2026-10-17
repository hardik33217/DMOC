import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateQuery, validateParams, uuidParamSchema, paginationSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, CreateWorkflowSchema, UpdateWorkflowSchema, CreateWorkflowNodeSchema, UpdateWorkflowNodeSchema, CreateWorkflowEdgeSchema, UpdateWorkflowEdgeSchema, RunWorkflowSchema, WorkflowStatusSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateWorkflow } from "../services/workflowExecutor.js";

const router = Router();

const workflowFilterSchema = z.object({
  status: WorkflowStatusSchema.optional(),
  isTemplate: z.coerce.boolean().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
}).merge(paginationSchema);

router.get("/", validateQuery(workflowFilterSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = "1", limit = "20", sortBy, sortOrder, status, isTemplate, search, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const userId = req.user!.id;

  const where: Record<string, unknown> = { ownerId: userId };
  if (status) where.status = status;
  if (isTemplate !== undefined) where.isTemplate = isTemplate;
  if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
  }

  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      orderBy: { [sortBy || "updatedAt"]: sortOrder || "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        _count: { select: { nodes: true, edges: true, runs: true } },
      },
    }),
    prisma.workflow.count({ where }),
  ]);

  res.json(createApiResponse(workflows, { page: parseInt(page), limit: parseInt(limit), total }));
}));

router.get("/templates", asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const templates = await prisma.workflow.findMany({
    where: { isTemplate: true },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { nodes: true, edges: true } },
    },
  });
  res.json(createApiResponse(templates));
}));

router.get("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({
    where: { id, ownerId: userId },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      edges: { orderBy: { createdAt: "asc" } },
      _count: { select: { nodes: true, edges: true, runs: true } },
    },
  });

  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  res.json(createApiResponse({
    ...workflow,
    nodes: workflow.nodes.map(n => ({ ...n, config: JSON.parse(n.config) })),
  }));
}));

router.post("/", validateBody(CreateWorkflowSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title, description, isTemplate, templateId } = req.body;

  if (templateId) {
    const template = await prisma.workflow.findFirst({
      where: { id: templateId, isTemplate: true },
      include: { nodes: true, edges: true },
    });
    if (!template) {
      res.status(404).json(createApiError("NOT_FOUND", "Template not found"));
      return;
    }

    const duplicated = await prisma.$transaction(async (tx: any) => {
      const newWorkflow = await tx.workflow.create({
        data: {
          ownerId: userId,
          title,
          description: description ?? template.description,
          status: "draft",
          isTemplate: false,
          templateId: template.id,
        },
      });

      const nodeMap = new Map<string, string>();
      for (const node of template.nodes) {
        const newNode = await tx.workflowNode.create({
          data: {
            workflowId: newWorkflow.id,
            type: node.type,
            title: node.title,
            description: node.description,
            positionX: node.positionX,
            positionY: node.positionY,
            width: node.width,
            height: node.height,
            config: node.config,
            schemaVersion: node.schemaVersion,
          },
        });
        nodeMap.set(node.id, newNode.id);
      }

      for (const edge of template.edges) {
        const sourceNodeId = nodeMap.get(edge.sourceNodeId);
        const targetNodeId = nodeMap.get(edge.targetNodeId);
        if (sourceNodeId && targetNodeId) {
          await tx.workflowEdge.create({
            data: {
              workflowId: newWorkflow.id,
              sourceNodeId,
              targetNodeId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              label: edge.label,
            },
          });
        }
      }

      return newWorkflow;
    });

    res.status(201).json(createApiResponse(duplicated));
    return;
  }

  const workflow = await prisma.workflow.create({
    data: {
      ownerId: userId,
      title,
      description,
      status: "draft",
      isTemplate: isTemplate ?? false,
    },
  });

  await prisma.auditEvent.create({
    data: { actorId: userId, action: "create", entityType: "Workflow", entityId: workflow.id, metadata: JSON.stringify({ title, isTemplate: isTemplate ?? false }) },
  });

  res.status(201).json(createApiResponse(workflow));
}));

router.patch("/:id", validateParams(uuidParamSchema), validateBody(UpdateWorkflowSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title, description, status, isTemplate } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  if (isTemplate !== undefined && isTemplate && workflow.isTemplate !== isTemplate) {
    const existingRuns = await prisma.workflowRun.count({ where: { workflowId: id } });
    if (existingRuns > 0) {
      res.status(400).json(createApiError("INVALID_OPERATION", "Cannot convert workflow with runs to template"));
      return;
    }
  }

  const updated = await prisma.workflow.update({
    where: { id },
    data: {
      title: title ?? workflow.title,
      description: description ?? workflow.description,
      status: status ?? workflow.status,
      isTemplate: isTemplate ?? workflow.isTemplate,
      version: workflow.version + 1,
    },
  });

  res.json(createApiResponse(updated));
}));

const syncGraphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string().optional().nullable(),
    positionX: z.number(),
    positionY: z.number(),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
    config: z.string(),
    schemaVersion: z.number().default(1),
  })),
  edges: z.array(z.object({
    id: z.string().optional().nullable(),
    sourceNodeId: z.string(),
    targetNodeId: z.string(),
    sourceHandle: z.string().optional().nullable(),
    targetHandle: z.string().optional().nullable(),
    label: z.string().optional().nullable(),
  })),
});

router.put("/:id/graph", validateParams(uuidParamSchema), validateBody(syncGraphSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { nodes, edges } = req.body;

  const workflow = await prisma.workflow.findFirst({ where: { id, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  await prisma.$transaction(async (tx: any) => {
    // 1. Delete existing edges first
    await tx.workflowEdge.deleteMany({ where: { workflowId: id } });

    // 2. Delete existing nodes
    await tx.workflowNode.deleteMany({ where: { workflowId: id } });

    // 3. Create new nodes
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        await tx.workflowNode.create({
          data: {
            id: node.id,
            workflowId: id,
            type: node.type,
            title: node.title,
            description: node.description ?? null,
            positionX: node.positionX,
            positionY: node.positionY,
            width: node.width ?? null,
            height: node.height ?? null,
            config: node.config,
            schemaVersion: node.schemaVersion || 1,
          },
        });
      }
    }

    // 4. Create new edges
    if (edges && edges.length > 0) {
      for (const edge of edges) {
        await tx.workflowEdge.create({
          data: {
            id: edge.id || undefined,
            workflowId: id,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            label: edge.label ?? null,
          },
        });
      }
    }

    // 5. Increment version
    await tx.workflow.update({
      where: { id },
      data: {
        version: { increment: 1 },
      },
    });
  });

  const updatedWorkflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      edges: { orderBy: { createdAt: "asc" } },
    },
  });

  res.json(createApiResponse({
    ...updatedWorkflow,
    nodes: updatedWorkflow?.nodes.map((n: any) => ({ ...n, config: JSON.parse(n.config) })),
  }));
}));

router.post("/:id/validate", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({
    where: { id, ownerId: userId },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const result = await validateWorkflow(workflow);
  res.json(createApiResponse(result));
}));

router.delete("/:id", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({ where: { id, ownerId: userId } });
  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  await prisma.workflow.delete({ where: { id } });

  res.json(createApiResponse({ message: "Workflow deleted" }));
}));

router.post("/:id/duplicate", validateParams(uuidParamSchema), asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workflow = await prisma.workflow.findFirst({
    where: { id, ownerId: userId },
    include: { nodes: true, edges: true },
  });

  if (!workflow) {
    res.status(404).json(createApiError("NOT_FOUND", "Workflow not found"));
    return;
  }

  const duplicated = await prisma.$transaction(async (tx: any) => {
    const newWorkflow = await tx.workflow.create({
      data: {
        ownerId: userId,
        title: `${workflow.title} (Copy)`,
        description: workflow.description,
        status: "draft",
        isTemplate: false,
      },
    });

    const nodeMap = new Map<string, string>();
    for (const node of workflow.nodes) {
      const newNode = await tx.workflowNode.create({
        data: {
          workflowId: newWorkflow.id,
          type: node.type,
          title: node.title,
          description: node.description,
          positionX: node.positionX,
          positionY: node.positionY,
          width: node.width,
          height: node.height,
          config: node.config,
          schemaVersion: node.schemaVersion,
        },
      });
      nodeMap.set(node.id, newNode.id);
    }

    for (const edge of workflow.edges) {
      const sourceNodeId = nodeMap.get(edge.sourceNodeId);
      const targetNodeId = nodeMap.get(edge.targetNodeId);
      if (sourceNodeId && targetNodeId) {
        await tx.workflowEdge.create({
          data: {
            workflowId: newWorkflow.id,
            sourceNodeId,
            targetNodeId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            label: edge.label,
          },
        });
      }
    }

    return newWorkflow;
  });

  const fullWorkflow = await prisma.workflow.findUnique({
    where: { id: duplicated.id },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      edges: { orderBy: { createdAt: "asc" } },
      _count: { select: { nodes: true, edges: true, runs: true } },
    },
  });

  res.status(201).json(createApiResponse({
    ...fullWorkflow!,
    nodes: fullWorkflow!.nodes.map(n => ({ ...n, config: JSON.parse(n.config) })),
  }));
}));

export { router as workflowsRouter };