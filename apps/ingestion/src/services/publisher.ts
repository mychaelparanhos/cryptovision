import { Redis } from "@upstash/redis";
import type {
  FundingSnapshot,
  OISnapshot,
  LiquidationEvent,
  OHLCVCandle,
  ExchangeHealthStatus,
} from "@cryptovision/shared";
import { logger } from "../utils/logger";

const CACHE_TTL_SECONDS = 15 * 60; // 15 min for free tier delay

export class Publisher {
  private redis: Redis;

  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({ url: redisUrl, token: redisToken });
  }

  async publishFunding(event: FundingSnapshot): Promise<void> {
    await Promise.all([
      this.redis.publish("cv:funding", JSON.stringify(event)),
      this.redis.set(
        `cv:cache:funding:${event.symbol}`,
        JSON.stringify(event),
        { ex: CACHE_TTL_SECONDS }
      ),
    ]);
  }

  async publishOI(event: OISnapshot): Promise<void> {
    await Promise.all([
      this.redis.publish("cv:oi", JSON.stringify(event)),
      this.redis.set(
        `cv:cache:oi:${event.symbol}`,
        JSON.stringify(event),
        { ex: CACHE_TTL_SECONDS }
      ),
    ]);
  }

  async publishLiquidation(event: LiquidationEvent): Promise<void> {
    await Promise.all([
      this.redis.publish("cv:liquidations", JSON.stringify(event)),
      this.redis.set(
        `cv:cache:liq:${event.symbol}:${event.timestamp.getTime()}`,
        JSON.stringify(event),
        { ex: CACHE_TTL_SECONDS }
      ),
    ]);
  }

  async publishCandle(candle: OHLCVCandle): Promise<void> {
    await this.redis.publish("cv:trades", JSON.stringify(candle));
    // Candles not cached individually — screener uses funding/OI cache
  }

  async publishHealth(status: ExchangeHealthStatus): Promise<void> {
    await Promise.all([
      this.redis.publish("cv:health", JSON.stringify(status)),
      this.redis.set(
        `cv:health:${status.exchange}`,
        JSON.stringify(status),
        { ex: 120 }
      ),
    ]);
  }

  async getDelayedData(type: string, symbol: string): Promise<string | null> {
    return this.redis.get<string>(`cv:cache:${type}:${symbol}`);
  }
}
