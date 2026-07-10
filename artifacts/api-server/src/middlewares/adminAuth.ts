import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Lightweight admin auth middleware.
 *
 * In production: requires an `x-admin-key` header matching ADMIN_API_KEY.
 * In development: allows all requests so the local admin panel works without setup.
 *
 * Set ADMIN_API_KEY as a Replit Secret to enable protection in production.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const adminKey = process.env["ADMIN_API_KEY"];

  // Skip auth in development or when no key is configured
  if (!adminKey || process.env["NODE_ENV"] === "development") {
    next();
    return;
  }

  const provided = req.headers["x-admin-key"];
  if (!provided || provided !== adminKey) {
    logger.warn({ url: req.url }, "Unauthorized admin request rejected");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
