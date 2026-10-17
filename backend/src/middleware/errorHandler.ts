import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { createApiError } from "@decisionos/shared";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("Error:", err);

  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400) {
    return res.status(400).json(createApiError("INVALID_JSON", "Malformed JSON payload: please check your request body format"));
  }

  if (err instanceof ZodError) {
    return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid request data", {
      issues: err.errors.map(e => ({ path: e.path.join("."), message: e.message })),
    }));
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      return res.status(409).json(createApiError("CONFLICT", `${target} already exists`));
    }
    if (err.code === "P2025") {
      return res.status(404).json(createApiError("NOT_FOUND", "Record not found"));
    }
    return res.status(400).json(createApiError("DATABASE_ERROR", "Database operation failed"));
  }

  if (err instanceof PrismaClientValidationError) {
    console.error("PrismaClientValidationError:", err.message);
    return res.status(400).json(createApiError("VALIDATION_ERROR", "Invalid data provided", { message: err.message }));
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(createApiError(err.code, err.message, err.details));
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(createApiError("UNAUTHORIZED", "Invalid token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(createApiError("TOKEN_EXPIRED", "Token has expired"));
  }

  return res.status(500).json(createApiError("INTERNAL_ERROR", "An unexpected error occurred"));
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}