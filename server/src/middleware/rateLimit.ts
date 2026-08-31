import type { Request, Response, NextFunction } from "express";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_HITS = 40;
const buckets = new Map<string, Bucket>();

function clientId(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? "unknown";
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const id = clientId(req);
  const current = buckets.get(id);

  if (!current || current.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  current.count += 1;
  if (current.count > MAX_HITS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      error: "Too many requests. Please wait a moment and try again.",
    });
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [id, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(id);
  }
}, WINDOW_MS).unref();
