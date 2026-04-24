import "server-only";

/**
 * Simple in-memory sliding-window rate limiter.
 * Works for single-instance deployments (Vercel serverless, single Node process).
 * For multi-instance, replace the Map with a Redis-backed store (e.g. @upstash/ratelimit).
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Purge expired entries every 5 minutes to prevent memory leaks.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, win] of store.entries()) {
      if (win.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

/**
 * Check and increment a rate limit bucket.
 * @param key      Unique key (e.g. "ip:1.2.3.4", "user:abc123")
 * @param limit    Max requests allowed per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt < now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count += 1;
  const remaining = Math.max(0, limit - win.count);

  return {
    allowed: win.count <= limit,
    remaining,
    resetAt: win.resetAt,
  };
}

/**
 * Extract the client IP from a Next.js request.
 * Checks standard proxy headers before falling back to a constant.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Return a standardised 429 response with Retry-After header.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000);
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}
