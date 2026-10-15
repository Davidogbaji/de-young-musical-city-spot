import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";
import { sitemapXml } from "./services/content.service";
import { asyncHandler } from "./utils/asyncHandler";
import { errorHandler, notFound } from "./middleware/errorHandler";

export const app = express();
app.set("trust proxy", env.TRUST_PROXY); // how many proxies sit in front of this server (see .env.example)
// Photos are loaded from the website on another address, so images must be allowed cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = env.FRONTEND_URL.split(",").map((s) => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
// CSRF defence for cookie logins: a state-changing request from any other website origin is refused.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: { message: "Request blocked." } });
  next();
});
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR), { maxAge: "7d", setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff") }));
app.use(express.json({ limit: "1mb" }));
if (env.NODE_ENV !== "test") app.use(morgan("combined"));
// This address is the API, so search engines are told not to index it. The sitemap is for the website (see docs/DEPLOYMENT.md).
app.get("/robots.txt", (_req, res) => res.type("text/plain").send("User-agent: *\nDisallow: /\n"));
app.get("/sitemap.xml", asyncHandler(async (_req, res) => { res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(await sitemapXml()); }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
