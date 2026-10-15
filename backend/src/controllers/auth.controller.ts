import { Request, Response } from "express";
import { env } from "../config/env";
import * as svc from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { forgotBody, loginBody, registerBody, resetBody } from "../validators/auth.validators";

export function setSession(res: Response, token: string) {
  res.cookie(svc.SESSION_COOKIE, token, {
    httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: svc.SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await svc.register(registerBody.parse(req.body));
  setSession(res, token);
  res.status(201).json({ user });
});
export const login = asyncHandler(async (req: Request, res: Response) => {
  const b = loginBody.parse(req.body);
  const { user, token } = await svc.login(b.email, b.password);
  setSession(res, token);
  res.json({ user });
});
export const logout = (_req: Request, res: Response) => {
  res.clearCookie(svc.SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
};
export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: req.user ? await svc.getUser(req.user.id) : null });
});
export const forgot = asyncHandler(async (req: Request, res: Response) => {
  await svc.forgotPassword(forgotBody.parse(req.body).email);
  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});
export const reset = asyncHandler(async (req: Request, res: Response) => {
  const b = resetBody.parse(req.body);
  await svc.resetPassword(b.token, b.password);
  res.json({ message: "Password updated. You can now log in." });
});
