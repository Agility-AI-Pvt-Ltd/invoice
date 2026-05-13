import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ApiErrors } from "./errors";

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Generic sliding window rate limiter.
 * Default: 60 requests per minute.
 */
export const apiRateLimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

/**
 * Strict limiter for expensive operations (e.g., Invoice Creation, PDF generation).
 * Default: 5 requests per minute.
 */
export const expensiveActionLimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:expensive",
    })
  : null;

/**
 * Helper to enforce rate limiting in API routes.
 * Throws ApiErrors.RATE_LIMIT_EXCEEDED if limit is reached.
 */
export async function enforceRateLimit(identifier: string, limiter: Ratelimit | null) {
  if (!limiter) return;

  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw ApiErrors.RATE_LIMIT_EXCEEDED(`Too many requests. Please try again in ${retryAfter}s.`);
  }
}
