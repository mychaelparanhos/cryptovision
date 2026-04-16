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
const LATEST_TTL_SECONDS = 30; // SSE polling window
const MAX_LATEST_LIQUIDATIONS = 50;

export class Publisher {
  private redis: Redis;

  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({ url: redisUrl, token: redisToken });
  }

  // ─── Funding ──────────────────────────────────────────────

  async publishFunding(event: FundingSnapshot): Promise<void> {
    const perExchangeKey = `cv:cache:funding:${event.exchange}:${event.symbol}`;
    const payload = JSON.stringify(event);

    await Promise.all([
      this.redis.publish("cv:funding", payload),
      // Per-exchange cache
      this.redis.set(perExchangeKey, payload, { ex: CACHE_TTL_SECONDS }),
      // Aggregated cache (recompute from all exchanges)
      this.updateAggregatedFunding(event.symbol),
      // SSE latest
      this.redis.set("cv:latest:funding", payload, { ex: LATEST_TTL_SECONDS }),
    ]);
  }

  private async updateAggregatedFunding(symbol: string): Promise<void> {
    const exchanges = ["binance", "bybit", "okx"] as const;
    const keys = exchanges.map((e) => `cv:cache:funding:${e}:${symbol}`);

    try {
      const results = await this.redis.mget<(string | null)[]>(...keys);
      const snapshots: FundingSnapshot[] = [];

      for (const raw of results) {
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          snapshots.push(parsed);
        }
      }

      if (snapshots.length === 0) return;

      // Weighted average by exchange count (OI-weighted would need OI data cross-reference)
      const avgRate =
        snapshots.reduce((sum, s) => sum + Number(s.rate), 0) /
        snapshots.length;

      const agg = {
        exchange: "aggregated",
        symbol,
        rate: avgRate,
        predictedRate: null,
        nextFundingTime: snapshots[0].nextFundingTime,
        timestamp: new Date().toISOString(),
        sources: snapshots.map((s) => s.exchange),
      };

      await this.redis.set(
        `cv:cache:funding:agg:${symbol}`,
        JSON.stringify(agg),
        { ex: CACHE_TTL_SECONDS }
      );
    } catch (err) {
      logger.error("Publisher", `Failed to aggregate funding for ${symbol}`, err);
    }
  }

  // ─── Open Interest ────────────────────────────────────────

  async publishOI(event: OISnapshot): Promise<void> {
    const perExchangeKey = `cv:cache:oi:${event.exchange}:${event.symbol}`;
    const payload = JSON.stringify(event);

    await Promise.all([
      this.redis.publish("cv:oi", payload),
      // Per-exchange cache
      this.redis.set(perExchangeKey, payload, { ex: CACHE_TTL_SECONDS }),
      // Aggregated cache (sum across exchanges)
      this.updateAggregatedOI(event.symbol),
      // SSE latest
      this.redis.set("cv:latest:oi", payload, { ex: LATEST_TTL_SECONDS }),
    ]);
  }

  private async updateAggregatedOI(symbol: string): Promise<void> {
    const exchanges = ["binance", "bybit", "okx"] as const;
    const keys = exchanges.map((e) => `cv:cache:oi:${e}:${symbol}`);

    try {
      const results = await this.redis.mget<(string | null)[]>(...keys);
      const snapshots: OISnapshot[] = [];

      for (const raw of results) {
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          snapshots.push(parsed);
        }
      }

      if (snapshots.length === 0) return;

      // OI: sum across exchanges
      const totalValue = snapshots.reduce(
        (sum, s) => sum + Number(s.value),
        0
      );

      const agg = {
        exchange: "aggregated",
        symbol,
        value: totalValue,
        timestamp: new Date().toISOString(),
        sources: snapshots.map((s) => s.exchange),
      };

      await this.redis.set(
        `cv:cache:oi:agg:${symbol}`,
        JSON.stringify(agg),
        { ex: CACHE_TTL_SECONDS }
      );
    } catch (err) {
      logger.error("Publisher", `Failed to aggregate OI for ${symbol}`, err);
    }
  }

  // ─── Liquidations ─────────────────────────────────────────

  async publishLiquidation(event: LiquidationEvent): Promise<void> {
    const perExchangeKey = `cv:cache:liq:${event.exchange}:${event.symbol}:${event.timestamp.getTime()}`;
    const payload = JSON.stringify(event);

    await Promise.all([
      this.redis.publish("cv:liquidations", payload),
      // Per-exchange cache (individual event)
      this.redis.set(perExchangeKey, payload, { ex: CACHE_TTL_SECONDS }),
      // Aggregated: append to latest liquidations list
      this.appendToLatestLiquidations(event),
      // SSE latest
      this.redis.set("cv:latest:liquidations", payload, {
        ex: LATEST_TTL_SECONDS,
      }),
    ]);
  }

  private async appendToLatestLiquidations(
    event: LiquidationEvent
  ): Promise<void> {
    const key = `cv:cache:liq:agg:${event.symbol}:latest`;
    try {
      // Use a sorted set with score = valueUsd for top liquidations
      await this.redis.zadd(key, {
        score: Number(event.valueUsd),
        member: JSON.stringify(event),
      });
      // Trim to keep only top N by value
      const count = await this.redis.zcard(key);
      if (count > MAX_LATEST_LIQUIDATIONS) {
        await this.redis.zremrangebyrank(
          key,
          0,
          count - MAX_LATEST_LIQUIDATIONS - 1
        );
      }
      await this.redis.expire(key, CACHE_TTL_SECONDS);
    } catch (err) {
      logger.error("Publisher", `Failed to append liquidation for ${event.symbol}`, err);
    }
  }

  // ─── Candles ──────────────────────────────────────────────

  async publishCandle(candle: OHLCVCandle): Promise<void> {
    const payload = JSON.stringify(candle);
    await Promise.all([
      this.redis.publish("cv:trades", payload),
      this.redis.set("cv:latest:trades", payload, {
        ex: LATEST_TTL_SECONDS,
      }),
    ]);
  }

  // ─── Health ───────────────────────────────────────────────

  async publishHealth(status: ExchangeHealthStatus): Promise<void> {
    const payload = JSON.stringify(status);
    await Promise.all([
      this.redis.publish("cv:health", payload),
      this.redis.set(`cv:health:${status.exchange}`, payload, { ex: 120 }),
      this.redis.set("cv:latest:health", payload, {
        ex: LATEST_TTL_SECONDS,
      }),
    ]);
  }

  // ─── Read helpers ─────────────────────────────────────────

  async getDelayedData(
    type: string,
    exchange: string,
    symbol: string
  ): Promise<string | null> {
    return this.redis.get<string>(
      `cv:cache:${type}:${exchange}:${symbol}`
    );
  }

  async getAggregatedData(
    type: string,
    symbol: string
  ): Promise<string | null> {
    return this.redis.get<string>(`cv:cache:${type}:agg:${symbol}`);
  }
}
