import { EventEmitter } from "events";
import WebSocket from "ws";
import type {
  ExchangeName,
  MarketTrade,
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
  ExchangeHealthStatus,
} from "@cryptovision/shared";
import type { ExchangeAdapter, ExchangeAdapterConfig, ReconnectPolicy } from "./types";
import { DEFAULT_RECONNECT } from "./types";
import { logger } from "../utils/logger";

const BINANCE_WS_BASE = "wss://fstream.binance.com";
const BINANCE_REST_BASE = "https://fapi.binance.com";

export class BinanceAdapter extends EventEmitter implements ExchangeAdapter {
  readonly name: ExchangeName = "binance";

  private ws: WebSocket | null = null;
  private config: ExchangeAdapterConfig | null = null;
  private reconnectPolicy: ReconnectPolicy;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private oiPollTimer: ReturnType<typeof setInterval> | null = null;
  private fundingPollTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private lastEventTime = Date.now();
  private reconnectCount = 0;

  constructor(reconnectPolicy: ReconnectPolicy = DEFAULT_RECONNECT) {
    super();
    this.reconnectPolicy = reconnectPolicy;
  }

  async connect(config: ExchangeAdapterConfig): Promise<void> {
    this.config = config;
    logger.info("BinanceAdapter", `Connecting with ${config.symbols.length} symbols`);

    await this.connectWebSocket();

    if (config.enableOI) {
      this.startOIPoll();
    }
    if (config.enableFunding) {
      this.startFundingPoll();
    }
  }

  async disconnect(): Promise<void> {
    logger.info("BinanceAdapter", "Disconnecting");
    this.connected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.oiPollTimer) {
      clearInterval(this.oiPollTimer);
      this.oiPollTimer = null;
    }
    if (this.fundingPollTimer) {
      clearInterval(this.fundingPollTimer);
      this.fundingPollTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getHealth(): ExchangeHealthStatus {
    return {
      exchange: this.name,
      status: this.connected ? "online" : "offline",
      latencyMs: Date.now() - this.lastEventTime,
      lastHeartbeat: new Date(this.lastEventTime),
      reconnectCount: this.reconnectCount,
    };
  }

  // ─── WebSocket Connection ─────────────────────────────────

  private async connectWebSocket(): Promise<void> {
    if (!this.config) return;

    const streams: string[] = [];

    if (this.config.enableTrades) {
      for (const symbol of this.config.symbols) {
        streams.push(`${symbol.toLowerCase()}@aggTrade`);
      }
    }

    if (this.config.enableLiquidations) {
      streams.push("!forceOrder@arr");
    }

    if (this.config.enableFunding) {
      streams.push("!markPrice@arr@1s");
    }

    const wsUrl = `${BINANCE_WS_BASE}/stream?streams=${streams.join("/")}`;
    logger.info("BinanceAdapter", `Connecting to WS with ${streams.length} streams`);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        logger.info("BinanceAdapter", "WebSocket connected");
        this.connected = true;
        this.reconnectAttempt = 0;
        this.lastEventTime = Date.now();
        resolve();
      });

      this.ws.on("message", (data: Buffer) => {
        try {
          this.handleMessage(JSON.parse(data.toString()));
        } catch (err) {
          logger.error("BinanceAdapter", "Failed to parse message", err);
        }
      });

      this.ws.on("close", (code: number, reason: Buffer) => {
        logger.warn("BinanceAdapter", `WebSocket closed: ${code} ${reason.toString()}`);
        this.connected = false;
        this.scheduleReconnect();
      });

      this.ws.on("error", (err: Error) => {
        logger.error("BinanceAdapter", "WebSocket error", err.message);
        this.emit("error", err);
        if (!this.connected) reject(err);
      });
    });
  }

  private handleMessage(msg: { stream: string; data: unknown }): void {
    this.lastEventTime = Date.now();
    const stream = msg.stream;

    if (stream?.includes("@aggTrade")) {
      this.handleAggTrade(msg.data as BinanceAggTrade);
    } else if (stream === "!forceOrder@arr") {
      this.handleLiquidation(msg.data as BinanceLiquidation);
    } else if (stream === "!markPrice@arr@1s") {
      this.handleMarkPrices(msg.data as BinanceMarkPrice[]);
    }
  }

  // ─── Event Handlers ───────────────────────────────────────

  private handleAggTrade(data: BinanceAggTrade): void {
    const trade: MarketTrade = {
      exchange: this.name,
      symbol: data.s,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      isBuyer: data.m === false, // m=true means seller is maker → buyer is taker
      tradeId: `binance-${data.a}`,
      timestamp: new Date(data.T),
    };
    this.emit("trade", trade);
  }

  private handleLiquidation(data: BinanceLiquidation): void {
    const o = data.o;
    const price = parseFloat(o.p);
    const qty = parseFloat(o.q);
    const liq: LiquidationEvent = {
      exchange: this.name,
      symbol: o.s,
      side: o.S === "BUY" ? "SHORT" : "LONG", // BUY liquidation = SHORT was liquidated
      quantity: qty,
      price,
      valueUsd: price * qty,
      timestamp: new Date(o.T),
    };
    this.emit("liquidation", liq);
  }

  private handleMarkPrices(data: BinanceMarkPrice[]): void {
    for (const mp of data) {
      if (!this.config?.symbols.includes(mp.s)) continue;
      const funding: FundingSnapshot = {
        exchange: this.name,
        symbol: mp.s,
        rate: parseFloat(mp.r),
        predictedRate: parseFloat(mp.P) || null,
        nextFundingTime: mp.T ? new Date(mp.T) : null,
        timestamp: new Date(mp.E),
      };
      this.emit("funding", funding);
    }
  }

  // ─── REST Polling ─────────────────────────────────────────

  private startOIPoll(): void {
    const poll = async () => {
      if (!this.config) return;
      for (const symbol of this.config.symbols) {
        try {
          const res = await fetch(
            `${BINANCE_REST_BASE}/fapi/v1/openInterest?symbol=${symbol}`
          );
          const data = (await res.json()) as { openInterest: string; time: number };
          const oi: OISnapshot = {
            exchange: this.name,
            symbol,
            value: parseFloat(data.openInterest),
            timestamp: new Date(data.time),
          };
          this.emit("oi", oi);
          this.lastEventTime = Date.now();
        } catch (err) {
          logger.error("BinanceAdapter", `OI poll failed for ${symbol}`, err);
        }
      }
    };

    poll(); // First poll immediately
    this.oiPollTimer = setInterval(poll, 15_000); // Every 15s
  }

  private startFundingPoll(): void {
    const poll = async () => {
      if (!this.config) return;
      try {
        const res = await fetch(`${BINANCE_REST_BASE}/fapi/v1/premiumIndex`);
        const data = (await res.json()) as BinancePremiumIndex[];
        for (const item of data) {
          if (!this.config.symbols.includes(item.symbol)) continue;
          const funding: FundingSnapshot = {
            exchange: this.name,
            symbol: item.symbol,
            rate: parseFloat(item.lastFundingRate),
            predictedRate: parseFloat(item.estimatedSettlePrice) || null,
            nextFundingTime: new Date(item.nextFundingTime),
            timestamp: new Date(item.time),
          };
          this.emit("funding", funding);
        }
        this.lastEventTime = Date.now();
      } catch (err) {
        logger.error("BinanceAdapter", "Funding poll failed", err);
      }
    };

    poll();
    this.fundingPollTimer = setInterval(poll, 30 * 60_000); // Every 30min
  }

  // ─── Reconnection ─────────────────────────────────────────

  private scheduleReconnect(): void {
    const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = this.reconnectPolicy;

    if (maxRetries !== -1 && this.reconnectAttempt >= maxRetries) {
      logger.error("BinanceAdapter", "Max reconnect attempts reached");
      this.emit("error", new Error("Max reconnect attempts reached"));
      return;
    }

    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, this.reconnectAttempt),
      maxDelay
    );

    this.reconnectAttempt++;
    this.reconnectCount++;

    logger.info("BinanceAdapter", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.emit("reconnecting", { attempt: this.reconnectAttempt, delay });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connectWebSocket();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }
}

// ─── Binance API Types ──────────────────────────────────────

interface BinanceAggTrade {
  s: string;  // Symbol
  a: number;  // Agg trade ID
  p: string;  // Price
  q: string;  // Quantity
  T: number;  // Trade time
  m: boolean; // Is buyer maker
}

interface BinanceLiquidation {
  o: {
    s: string;  // Symbol
    S: string;  // Side (BUY/SELL)
    p: string;  // Price
    q: string;  // Quantity
    T: number;  // Time
  };
}

interface BinanceMarkPrice {
  s: string;  // Symbol
  r: string;  // Funding rate
  P: string;  // Predicted funding rate
  T: number;  // Next funding time
  E: number;  // Event time
}

interface BinancePremiumIndex {
  symbol: string;
  lastFundingRate: string;
  estimatedSettlePrice: string;
  nextFundingTime: number;
  time: number;
}
