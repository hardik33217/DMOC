import { Router, Response, Request, NextFunction } from "express";
import { prisma } from "../index.js";
import { createApiResponse, createApiError } from "@decisionos/shared";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return res.json(createApiResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    version: process.env.npm_package_version || "1.0.0",
  }));
}));

router.get("/ready", asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json(createApiResponse({ ready: true }));
  } catch {
    return res.status(503).json(createApiError("SERVICE_UNAVAILABLE", "Database not ready"));
  }
}));

router.get("/live", asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
  return res.json(createApiResponse({ alive: true }));
}));

export { router as healthRouter };