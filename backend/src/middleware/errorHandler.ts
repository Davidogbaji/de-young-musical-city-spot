import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Route not found" } });
}

// Consistent error shape: { error: { message, details? } }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { message: "Invalid request", details: err.flatten().fieldErrors } });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message } });
  }
  const code = (err as { code?: string } | null)?.code;
  if (code === "P2002") return res.status(409).json({ error: { message: "That value is already in use. Choose a different one." } });
  if (code === "P2025") return res.status(404).json({ error: { message: "Not found" } });
  if ((err as { name?: string } | null)?.name === "MulterError") return res.status(400).json({ error: { message: "The image must be 5 MB or smaller." } });
  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong on our side. Please try again." } });
}
