import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index.js";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, setAuthCookies, clearAuthCookies, AuthRequest } from "../middleware/auth.js";
import { validateBody } from "../utils/validation.js";
import { createApiResponse, createApiError, RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@decisionos/shared";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post("/register", validateBody(RegisterSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return res.status(400).json(createApiError("WEAK_PASSWORD", "Password does not meet requirements", { errors: strength.errors }));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json(createApiError("EMAIL_EXISTS", "An account with this email already exists"));
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: { id: true, email: true, name: true, role: true, theme: true, emailVerified: true, createdAt: true },
  });

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
  setAuthCookies(res, accessToken, refreshToken);

  try {
    await prisma.auditEvent.create({
      data: { actorId: user.id, action: "create", entityType: "User", entityId: user.id },
    });
  } catch (err) {
    console.warn("Audit event creation deferred:", (err as Error).message);
  }

  return res.status(201).json(createApiResponse({ user, accessToken }));
}));

router.post("/login", validateBody(LoginSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json(createApiError("INVALID_CREDENTIALS", "Invalid email or password"));
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    return res.status(401).json(createApiError("INVALID_CREDENTIALS", "Invalid email or password"));
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
  setAuthCookies(res, accessToken, refreshToken);

  try {
    await prisma.auditEvent.create({
      data: { actorId: user.id, action: "login", entityType: "User", entityId: user.id, ipAddress: req.ip, userAgent: req.get("user-agent") },
    });
  } catch (err) {
    console.warn("Audit event creation deferred:", (err as Error).message);
  }

  return res.json(createApiResponse({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, theme: user.theme, emailVerified: user.emailVerified },
    accessToken,
  }));
}));

router.post("/logout", asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user) {
    try {
      await prisma.auditEvent.create({
        data: { actorId: req.user.id, action: "logout", entityType: "User", entityId: req.user.id },
      });
    } catch (err) {
      console.warn("Audit event creation deferred:", (err as Error).message);
    }
  }
  clearAuthCookies(res);
  return res.json(createApiResponse({ message: "Logged out successfully" }));
}));

router.post("/refresh", asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json(createApiError("UNAUTHORIZED", "Refresh token required"));
  }

  const { verifyRefreshToken } = await import("../middleware/auth.js");
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    clearAuthCookies(res);
    return res.status(401).json(createApiError("UNAUTHORIZED", "Invalid refresh token"));
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true } });
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json(createApiError("UNAUTHORIZED", "User not found"));
  }

  const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });
  setAuthCookies(res, newAccessToken, newRefreshToken);

  return res.json(createApiResponse({ accessToken: newAccessToken }));
}));

router.get("/me", asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json(createApiError("UNAUTHORIZED", "Not authenticated"));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, theme: true, emailVerified: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json(createApiError("NOT_FOUND", "User not found"));
  }

  return res.json(createApiResponse({ user }));
}));

router.post("/forgot-password", validateBody(ForgotPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json(createApiResponse({ message: "If an account exists, a reset link will be sent" }));
  }

  const resetToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: `${resetToken}|${expiresAt.getTime()}` },
  });

  console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

  return res.json(createApiResponse({ message: "If an account exists, a reset link will be sent" }));
}));

router.post("/reset-password", validateBody(ResetPasswordSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { passwordHash: { startsWith: `${token}|` } },
  });

  if (!user) {
    return res.status(400).json(createApiError("INVALID_TOKEN", "Invalid or expired reset token"));
  }

  const [, expiresAtStr] = user.passwordHash.split("|");
  const expiresAt = parseInt(expiresAtStr || "0", 10);
  if (Date.now() > expiresAt) {
    return res.status(400).json(createApiError("TOKEN_EXPIRED", "Reset token has expired"));
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return res.status(400).json(createApiError("WEAK_PASSWORD", "Password does not meet requirements", { errors: strength.errors }));
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  clearAuthCookies(res);
  return res.json(createApiResponse({ message: "Password reset successfully" }));
}));

router.post("/verify-email", validateBody(z.object({ token: z.string() })), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  const user = await prisma.user.findFirst({
    where: { passwordHash: { startsWith: `verify|${token}|` } },
  });

  if (!user) {
    return res.status(400).json(createApiError("INVALID_TOKEN", "Invalid or expired verification token"));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, passwordHash: user.passwordHash.replace(`verify|${token}|`, "") },
  });

  return res.json(createApiResponse({ message: "Email verified successfully" }));
}));

export { router as authRouter };