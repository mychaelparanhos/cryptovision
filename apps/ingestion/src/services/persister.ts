import postgres from "postgres";
import type {
  FundingSnapshot,
  OISnapshot,
  LiquidationEvent,
  OHLCVCandle,
  ExchangeHealthStatus,
} from "@cryptovision/shared";
import { logger } from "../utils/logger";

interface PendingEvents {
  funding: FundingSnapshot[];
  oi: OISnapshot[];
  liquidations: LiquidationEvent[];
  candles: OHLCVCandle[];
  health: ExchangeHealthStatus[];
}

export class Persister {
  private sql: postgres.Sql;
  private pending: PendingEvents = {
    funding: [],
    oi: [],
    liquidations: [],
    candles: [],
    health: [],
  };
  private timer: ReturnType<typeof setInterval> | null = null;
  private maxBuffer = 10_000;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }

  start(): void {
    this.timer = setInterval(() => this.flush(), 1000);
    logger.info("Persister", "Started batch insert loop (1s interval)");
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
    await this.sql.end();
    logger.info("Persister", "Stopped and flushed");
  }

  addFunding(event: FundingSnapshot): void {
    this.pending.funding.push(event);
    this.checkBuffer();
  }

  addOI(event: OISnapshot): void {
    this.pending.oi.push(event);
    this.checkBuffer();
  }

  addLiquidation(event: LiquidationEvent): void {
    this.pending.liquidations.push(event);
    this.checkBuffer();
  }

  addCandle(candle: OHLCVCandle): void {
    this.pending.candles.push(candle);
    this.checkBuffer();
  }

  addHealth(event: ExchangeHealthStatus): void {
    this.pending.health.push(event);
  }

  private checkBuffer(): void {
    const total =
      this.pending.funding.length +
      this.pending.oi.length +
      this.pending.liquidations.length +
      this.pending.candles.length;

    if (total > this.maxBuffer) {
      logger.warn("Persister", `Buffer exceeded ${this.maxBuffer}, forcing flush`);
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    const { funding, oi, liquidations, candles, health } = this.pending;
    this.pending = { funding: [], oi: [], liquidations: [], candles: [], health: [] };

    try {
      const promises: Promise<void>[] = [];

      if (funding.length > 0) {
        promises.push(this.insertFunding(funding));
      }
      if (oi.length > 0) {
        promises.push(this.insertOI(oi));
      }
      if (liquidations.length > 0) {
        promises.push(this.insertLiquidations(liquidations));
      }
      if (candles.length > 0) {
        promises.push(this.insertCandles(candles));
      }
      if (health.length > 0) {
        promises.push(this.insertHealth(health));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        const total = funding.length + oi.length + liquidations.length + candles.length;
        if (total > 0) {
          logger.debug(
            "Persister",
            `Flushed: ${funding.length}F ${oi.length}OI ${liquidations.length}L ${candles.length}C`
          );
        }
      }
    } catch (err) {
      logger.error("Persister", "Batch insert failed", err);
      // Re-queue failed events (up to buffer limit)
      this.pending.funding.push(...funding.slice(0, 1000));
      this.pending.oi.push(...oi.slice(0, 1000));
      this.pending.liquidations.push(...liquidations.slice(0, 1000));
      this.pending.candles.push(...candles.slice(0, 1000));
    }
  }

  private async insertFunding(events: FundingSnapshot[]): Promise<void> {
    await this.sql`
      INSERT INTO funding_rates (exchange, symbol, rate, predicted_rate, next_funding_time, timestamp)
      SELECT * FROM ${this.sql(
        events.map((e) => ({
          exchange: e.exchange,
          symbol: e.symbol,
          rate: e.rate.toString(),
          predicted_rate: e.predictedRate?.toString() ?? null,
          next_funding_time: e.nextFundingTime,
          timestamp: e.timestamp,
        }))
      )}
      ON CONFLICT DO NOTHING
    `;
  }

  private async insertOI(events: OISnapshot[]): Promise<void> {
    await this.sql`
      INSERT INTO open_interest (exchange, symbol, value, timestamp)
      SELECT * FROM ${this.sql(
        events.map((e) => ({
          exchange: e.exchange,
          symbol: e.symbol,
          value: e.value.toString(),
          timestamp: e.timestamp,
        }))
      )}
    `;
  }

  private async insertLiquidations(events: LiquidationEvent[]): Promise<void> {
    await this.sql`
      INSERT INTO liquidations (exchange, symbol, side, quantity, price, value_usd, timestamp)
      SELECT * FROM ${this.sql(
        events.map((e) => ({
          exchange: e.exchange,
          symbol: e.symbol,
          side: e.side,
          quantity: e.quantity.toString(),
          price: e.price.toString(),
          value_usd: e.valueUsd.toString(),
          timestamp: e.timestamp,
        }))
      )}
    `;
  }

  private async insertCandles(candles: OHLCVCandle[]): Promise<void> {
    await this.sql`
      INSERT INTO agg_trades (exchange, symbol, price, quantity, is_buyer, trade_id, timestamp)
      SELECT * FROM ${this.sql(
        candles.map((c) => ({
          exchange: c.exchange,
          symbol: c.symbol,
          price: c.close.toString(),
          quantity: (c.volumeBuy + c.volumeSell).toString(),
          is_buyer: c.volumeBuy > c.volumeSell,
          trade_id: `ohlcv-${c.exchange}-${c.symbol}-${c.timestamp.getTime()}`,
          timestamp: c.timestamp,
        }))
      )}
    `;
  }

  private async insertHealth(events: ExchangeHealthStatus[]): Promise<void> {
    const latest = events[events.length - 1];
    if (!latest) return;
    await this.sql`
      INSERT INTO exchange_health (exchange, status, latency_ms, last_heartbeat, timestamp)
      VALUES (${latest.exchange}, ${latest.status}, ${latest.latencyMs}, ${latest.lastHeartbeat}, now())
    `;
  }
}
