import { Request, Response, NextFunction } from "express";
import { prisma } from "../index.js";
import { AuditAction } from "@decisionos/shared";
import { AuthRequest } from "./auth.js";

interface AuditOptions {
  action: AuditAction;
  entityType: string;
  getEntityId?: (req: Request) => string | undefined;
  getMetadata?: (req: Request) => Record<string, unknown> | undefined;
}

export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const originalSend = res.send;
  let responseBody: unknown;

  res.send = function (body: unknown) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  const originalNext = next;
  next = ((err?: Error) => {
    if (req.user && req.method !== "GET") {
      const action = inferAction(req.method, req.path);
      if (action) {
        const entityType = inferEntityType(req.path);
        const entityId = extractEntityId(req.path);
        const metadata = extractMetadata(req, responseBody);

        prisma.auditEvent.create({
          data: {
            actorId: req.user.id,
            action,
            entityType,
            entityId,
            metadata: metadata as any,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
          },
        }).catch(console.error);
      }
    }
    originalNext(err);
  }) as NextFunction;

  next();
}

function inferAction(method: string, path: string): AuditAction | null {
  if (method === "POST") {
    if (path.includes("/login")) return "login";
    if (path.includes("/logout")) return "logout";
    if (path.includes("/share")) return "share";
    if (path.includes("/import")) return "import";
    if (path.includes("/export")) return "export";
    if (path.includes("/simulations")) return "simulate";
    return "create";
  }
  if (method === "PATCH" || method === "PUT") return "update";
  if (method === "DELETE") return "delete";
  return null;
}

function inferEntityType(path: string): string {
  if (path.includes("/decisions")) return "Decision";
  if (path.includes("/alternatives")) return "Alternative";
  if (path.includes("/criteria")) return "Criterion";
  if (path.includes("/outcomes")) return "Outcome";
  if (path.includes("/scenarios")) return "Scenario";
  if (path.includes("/simulations")) return "SimulationRun";
  if (path.includes("/shares")) return "DecisionShare";
  if (path.includes("/import")) return "ImportJob";
  return "Unknown";
}

function extractEntityId(path: string): string | undefined {
  const decisionMatch = path.match(/\/decisions\/([a-f0-9-]{36})/i);
  if (decisionMatch) return decisionMatch[1];

  const altMatch = path.match(/\/alternatives\/([a-f0-9-]{36})/i);
  if (altMatch) return altMatch[1];

  const critMatch = path.match(/\/criteria\/([a-f0-9-]{36})/i);
  if (critMatch) return critMatch[1];

  const outcomeMatch = path.match(/\/outcomes\/([a-f0-9-]{36})/i);
  if (outcomeMatch) return outcomeMatch[1];

  const scenarioMatch = path.match(/\/scenarios\/([a-f0-9-]{36})/i);
  if (scenarioMatch) return scenarioMatch[1];

  const simMatch = path.match(/\/simulations\/([a-f0-9-]{36})/i);
  if (simMatch) return simMatch[1];

  return undefined;
}

function extractMetadata(req: Request, responseBody: unknown): Record<string, unknown> | undefined {
  const metadata: Record<string, unknown> = {};

  if (Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.currentPassword;
    delete sanitizedBody.newPassword;
    delete sanitizedBody.confirmPassword;
    metadata.requestBody = sanitizedBody;
  }

  if (req.query && Object.keys(req.query).length > 0) {
    metadata.query = req.query;
  }

  if (responseBody && typeof responseBody === "object") {
    const resp = responseBody as Record<string, unknown>;
    if (resp.success === false && resp.error) {
      metadata.error = resp.error;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}