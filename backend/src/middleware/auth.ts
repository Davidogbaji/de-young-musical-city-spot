import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { SESSION_COOKIE } from "../services/auth.service";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

async function load(req: Request): Promise<{ id: number; role: Role } | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const p = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: Number(p.sub) }, select: { id: true, role: true, tokenVersion: true } });
    // tokenVersion changes on password reset/change, which ends old sessions everywhere.
    if (!user || user.tokenVersion !== p.v) return null;
    return { id: user.id, role: user.role };
  } catch { return null; }
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const u = await load(req);
  if (!u) throw new ApiError(401, "Please log in to continue.");
  req.user = u; next();
});
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const u = await load(req);
  if (u) req.user = u;
  next();
});
// Used by the admin dashboard (Stage 7). Enforced on the server, never just by hiding buttons.
export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, "You do not have access to this."));
  next();
};
