import { Ratelimit } from "@upstash/ratelimit";
import type { Plan } from "@cryptovision/shared";
import { getRedis } from "./redis";

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
