import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Fail-open: if Redis env vars are missing (local dev), skip rate limiting
const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit = isConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "15 m"), // 10 attempts per 15 min per IP
      analytics: false,
    })
  : null;

export async function checkAuthRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!ratelimit) return { allowed: true };

  const { success, reset } = await ratelimit.limit(identifier);
  if (!success) {
    return { allowed: false, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
  }
  return { allowed: true };
}
