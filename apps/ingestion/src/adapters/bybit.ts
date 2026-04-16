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

const BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/linear";
const BYBIT_REST_BASE = "https://api.bybit.com";

export class BybitAdapter extends EventEmitter implements ExchangeAdapter {
  readonly name: ExchangeName = "bybit";

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
    logger.info("BybitAdapter", `Connecting with ${config.symbols.length} symbols`);

    await this.connectWebSocket();

    if (config.enableOI) {
      this.startOIPoll();
    }
    if (config.enableFunding) {
      this.startFundingPoll();
    }
  }

  async disconnect(): Promise<void> {
    logger.info("BybitAdapter", "Disconnecting");
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

    logger.info("BybitAdapter", `Connecting to WS: ${BYBIT_WS_URL}`);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(BYBIT_WS_URL);

      this.ws.on("open", () => {
        logger.info("BybitAdapter", "WebSocket connected, sending subscriptions");
        this.connected = true;
        this.reconnectAttempt = 0;
        this.lastEventTime = Date.now();
        this.subscribe();
        resolve();
      });

      this.ws.on("message", (data: Buffer) => {
        try {
          this.handleMessage(JSON.parse(data.toString()));
        } catch (err) {
          logger.error("BybitAdapter", "Failed to parse message", err);
        }
      });

      this.ws.on("close", (code: number, reason: Buffer) => {
        logger.warn("BybitAdapter", `WebSocket closed: ${code} ${reason.toString()}`);
        this.connected = false;
        this.scheduleReconnect();
      });

      this.ws.on("error", (err: Error) => {
        logger.error("BybitAdapter", "WebSocket error", err.message);
        this.emit("error", err);
        if (!this.connected) reject(err);
      });
    });
  }

  private subscribe(): void {
    if (!this.ws || !this.config) return;

    const args: string[] = [];

    if (this.config.enableTrades) {
      for (const symbol of this.config.symbols) {
        args.push(`publicTrade.${symbol}`);
      }
    }

    if (this.config.enableLiquidations) {
      for (const symbol of this.config.symbols) {
        args.push(`liquidation.${symbol}`);
      }
    }

    if (args.length > 0) {
      const msg = JSON.stringify({ op: "subscribe", args });
      this.ws.send(msg);
      logger.info("BybitAdapter", `Subscribed to ${args.length} topics`);
    }
  }

  private handleMessage(msg: BybitWsMessage): void {
    this.lastEventTime = Date.now();

    // Ignore subscription confirmations and pong
    if (msg.op || msg.ret_msg === "pong") return;

    const topic = msg.topic;
    if (!topic) return;

    if (topic.startsWith("publicTrade.")) {
      this.handleTrades(msg.data as BybitTrade[]);
    } else if (topic.startsWith("liquidation.")) {
      this.handleLiquidation(msg.data as BybitLiquidation);
    }
  }

  // ─── Event Handlers ───────────────────────────────────────

  private handleTrades(trades: BybitTrade[]): void {
    for (const t of trades) {
      const trade: MarketTrade = {
        exchange: this.name,
        symbol: t.s,
        price: parseFloat(t.p),
        quantity: parseFloat(t.v),
        isBuyer: t.S === "Buy",
        tradeId: `bybit-${t.i}`,
        timestamp: new Date(t.T),
      };
      this.emit("trade", trade);
    }
  }

  private handleLiquidation(data: BybitLiquidation): void {
    const price = parseFloat(data.price);
    const qty = parseFloat(data.size);
    const liq: LiquidationEvent = {
      exchange: this.name,
      symbol: data.symbol,
      side: data.side === "Buy" ? "SHORT" : "LONG", // Buy liquidation = SHORT was liquidated
      quantity: qty,
      price,
      valueUsd: price * qty,
      timestamp: new Date(data.updatedTime),
    };
    this.emit("liquidation", liq);
  }

  // ─── REST Polling ─────────────────────────────────────────

  private startOIPoll(): void {
    const poll = async () => {
      if (!this.config) return;
      for (const symbol of this.config.symbols) {
        try {
          const res = await fetch(
            `${BYBIT_REST_BASE}/v5/market/tickers?category=linear&symbol=${symbol}`
          );
          const json = (await res.json()) as BybitTickerResponse;

          if (json.retCode !== 0 || !json.result?.list?.[0]) continue;

          const ticker = json.result.list[0];
          const oi: OISnapshot = {
            exchange: this.name,
            symbol,
            value: parseFloat(ticker.openInterest),
            timestamp: new Date(),
          };
          this.emit("oi", oi);
          this.lastEventTime = Date.now();
        } catch (err) {
          logger.error("BybitAdapter", `OI poll failed for ${symbol}`, err);
        }
      }
    };

    poll();
    this.oiPollTimer = setInterval(poll, 15_000);
  }

  private startFundingPoll(): void {
    const poll = async () => {
      if (!this.config) return;
      for (const symbol of this.config.symbols) {
        try {
          const res = await fetch(
            `${BYBIT_REST_BASE}/v5/market/tickers?category=linear&symbol=${symbol}`
          );
          const json = (await res.json()) as BybitTickerResponse;

          if (json.retCode !== 0 || !json.result?.list?.[0]) continue;

          const ticker = json.result.list[0];
          const funding: FundingSnapshot = {
            exchange: this.name,
            symbol,
            rate: parseFloat(ticker.fundingRate),
            predictedRate: null,
            nextFundingTime: ticker.nextFundingTime
              ? new Date(parseInt(ticker.nextFundingTime))
              : null,
            timestamp: new Date(),
          };
          this.emit("funding", funding);
          this.lastEventTime = Date.now();
        } catch (err) {
          logger.error("BybitAdapter", `Funding poll failed for ${symbol}`, err);
        }
      }
    };

    poll();
    this.fundingPollTimer = setInterval(poll, 30 * 60_000);
  }

  // ─── Reconnection ─────────────────────────────────────────

  private scheduleReconnect(): void {
    const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = this.reconnectPolicy;

    if (maxRetries !== -1 && this.reconnectAttempt >= maxRetries) {
      logger.error("BybitAdapter", "Max reconnect attempts reached");
      this.emit("error", new Error("Max reconnect attempts reached"));
      return;
    }

    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, this.reconnectAttempt),
      maxDelay
    );

    this.reconnectAttempt++;
    this.reconnectCount++;

    logger.info("BybitAdapter", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
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

// ─── Bybit API Types ──────────────────────────────────────

interface BybitWsMessage {
  topic?: string;
  op?: string;
  ret_msg?: string;
  data?: unknown;
}

interface BybitTrade {
  s: string;   // Symbol
  i: string;   // Trade ID
  p: string;   // Price
  v: string;   // Volume/Quantity
  S: string;   // Side: Buy/Sell
  T: number;   // Timestamp ms
}

interface BybitLiquidation {
  symbol: string;
  side: string;     // Buy/Sell
  price: string;
  size: string;
  updatedTime: number;
}

interface BybitTickerResponse {
  retCode: number;
  result: {
    list: BybitTicker[];
  };
}

interface BybitTicker {
  symbol: string;
  openInterest: string;
  fundingRate: string;
  nextFundingTime: string;
}
