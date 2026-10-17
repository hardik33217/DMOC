import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../index.js";
import { createApiError } from "@decisionos/shared";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || "15m";
}

function getRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN || "7d";
}

export function generateAccessToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: getExpiresIn() } as SignOptions);
}

export function generateRefreshToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_REFRESH_SECRET, { expiresIn: getRefreshExpiresIn() } as SignOptions);
}

export function verifyAccessToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const accessToken = req.cookies?.accessToken || bearerToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    return res.status(401).json(createApiError("UNAUTHORIZED", "Authentication required"));
  }

  let payload = accessToken ? verifyAccessToken(accessToken) : null;

  if (!payload && refreshToken) {
    payload = verifyRefreshToken(refreshToken);
    if (payload) {
      const newAccessToken = generateAccessToken(payload);
      const newRefreshToken = generateRefreshToken(payload);
      setAuthCookies(res, newAccessToken, newRefreshToken);
    }
  }

  if (!payload) {
    clearAuthCookies(res);
    return res.status(401).json(createApiError("UNAUTHORIZED", "Invalid or expired token"));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json(createApiError("UNAUTHORIZED", "User not found"));
  }

  req.user = user;
  next();
};

export const optionalAuthMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.accessToken;
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true },
      });
      if (user) req.user = user;
    }
  }
  next();
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isSecure = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
  };

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(createApiError("FORBIDDEN", "Insufficient permissions"));
    }
    next();
  };
}