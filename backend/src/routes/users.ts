import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { validateBody } from "../utils/validation.js";
import { createApiResponse, createApiError, UpdateUserSettingsSchema, ChangePasswordSchema } from "@decisionos/shared";
import { AuthRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../utils/password.js";

const router = Router();

router.get("/profile", asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, theme: true, emailVerified: true, createdAt: true },
  });
  return res.json(createApiResponse({ user }));
}));

router.patch("/settings", validateBody(UpdateUserSettingsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, theme, emailNotifications } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: name ?? undefined, theme: theme ?? undefined },
    select: { id: true, email: true, name: true, role: true, theme: true, emailVerified: true },
  });

  return res.json(createApiResponse({ user }));
}));

router.post("/change-password", validateBody(ChangePasswordSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json(createApiError("NOT_FOUND", "User not found"));
  }

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) {
    return res.status(401).json(createApiError("INVALID_CREDENTIALS", "Current password is incorrect"));
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return res.status(400).json(createApiError("WEAK_PASSWORD", "New password does not meet requirements", { errors: strength.errors }));
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return res.json(createApiResponse({ message: "Password changed successfully" }));
}));

router.get("/audit", asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "20", action, entityType } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { actorId: req.user!.id };
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return res.json(createApiResponse(events, { page: parseInt(page), limit: parseInt(limit), total }));
}));

router.delete("/account", validateBody(z.object({ password: z.string().min(1) })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json(createApiError("NOT_FOUND", "User not found"));
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    return res.status(401).json(createApiError("INVALID_CREDENTIALS", "Password is incorrect"));
  }

  await prisma.user.delete({ where: { id: user.id } });

  return res.json(createApiResponse({ message: "Account deleted" }));
}));

export { router as usersRouter };