import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { createApiError } from "@decisionos/shared";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid request body", {
        issues: result.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      }));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid query parameters", {
        issues: result.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      }));
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid route parameters", {
        issues: result.error.errors.map(e => ({ path: e.path.join("."), message: e.message })),
      }));
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}

export const uuidParamSchema = z.object({
  id: z.string().uuid().optional(),
  decisionId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  edgeId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
}).passthrough();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});