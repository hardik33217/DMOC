import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody, validateParams, uuidParamSchema } from "../utils/validation.js";
import { createApiResponse, createApiError, ShareDecisionSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import crypto from "crypto";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const shares = await prisma.decisionShare.findMany({
    where: { decisionId },
    orderBy: { createdAt: "desc" },
    include: { recipient: { select: { id: true, email: true, name: true } } },
  });

  return res.json(createApiResponse(shares));
}));

router.post("/", validateBody(ShareDecisionSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId } = req.params;
  const userId = req.user!.id;
  const { accessLevel, expiresAt, recipientEmail } = req.body;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const shareToken = crypto.randomBytes(32).toString("hex");
  const share = await prisma.decisionShare.create({
    data: {
      decisionId: decisionId!,
      shareToken,
      accessLevel: accessLevel ?? "view",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      recipientEmail,
      createdBy: userId,
    },
  });

  const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/shared/${shareToken}`;

  return res.status(201).json(createApiResponse({ ...share, shareUrl }));
}));

router.delete("/:shareId", validateParams(z.object({ shareId: z.string().uuid() })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decisionId, shareId } = req.params;
  const userId = req.user!.id;

  const decision = await prisma.decision.findFirst({ where: { id: decisionId, ownerId: userId } });
  if (!decision) {
    return res.status(404).json(createApiError("NOT_FOUND", "Decision not found"));
  }

  const share = await prisma.decisionShare.findFirst({ where: { id: shareId, decisionId } });
  if (!share) {
    return res.status(404).json(createApiError("NOT_FOUND", "Share not found"));
  }

  await prisma.decisionShare.delete({ where: { id: shareId } });

  return res.json(createApiResponse({ message: "Share revoked" }));
}));

router.get("/public/:token", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  const share = await prisma.decisionShare.findUnique({
    where: { shareToken: token },
    include: {
      decision: {
        include: {
          alternatives: { orderBy: { order: "asc" }, include: { outcomes: { orderBy: { order: "asc" } } } },
          criteria: { orderBy: { order: "asc" } },
          owner: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!share) {
    return res.status(404).json(createApiError("NOT_FOUND", "Shared decision not found"));
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    return res.status(410).json(createApiError("EXPIRED", "This share link has expired"));
  }

  return res.json(createApiResponse({
    decision: share.decision,
    accessLevel: share.accessLevel,
    shareId: share.id,
  }));
}));

export { router as sharesRouter };