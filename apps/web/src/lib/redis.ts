import { Redis } from "@upstash/redis";

let instance: Redis | null = null;

export function getRedis(): Redis | null {
  if (instance) return instance;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  instance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return instance;
}
