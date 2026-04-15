import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Plan } from "@cryptovision/shared";

let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const LIMITS: Record<Exclude<Plan, "enterprise">, number> = {
  free: 100,
  lite: 200,
  starter: 1000,
  pro: 50000,
};

export async function checkRateLimit(
  identifier: string,
  tier: Plan
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (tier === "enterprise") {
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  const r = getRedis();
  if (!r) {
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  const limit = LIMITS[tier];
  const ratelimit = new Ratelimit({
    redis: r,
    limiter: Ratelimit.fixedWindow(limit, "1 d"),
  });

  const result = await ratelimit.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
