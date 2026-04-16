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

const OKX_WS_URL = "wss://ws.okx.com:8443/ws/v5/public";
const OKX_REST_BASE = "https://www.okx.com";

// ─── Symbol Normalization ──────────────────────────────────

/**
 * Convert canonical symbol (BTCUSDT) to OKX instId (BTC-USDT-SWAP).
 */
export function toOKXInstId(symbol: string): string {
  // Match pairs like BTCUSDT, ETHUSDT, etc.
  const match = symbol.match(/^([A-Z]+)(USDT)$/);
  if (!match) return symbol;
  return `${match[1]}-${match[2]}-SWAP`;
}

/**
 * Convert OKX instId (BTC-USDT-SWAP) back to canonical symbol (BTCUSDT).
 */
export function fromOKXInstId(instId: string): string {
  // BTC-USDT-SWAP -> BTCUSDT
  const parts = instId.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}${parts[1]}`;
  }
  return instId;
}

export class OKXAdapter extends EventEmitter implements ExchangeAdapter {
  readonly name: ExchangeName = "okx";

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
    logger.info("OKXAdapter", `Connecting with ${config.symbols.length} symbols`);

    await this.connectWebSocket();

    if (config.enableOI) {
      this.startOIPoll();
    }
    if (config.enableFunding) {
      this.startFundingPoll();
    }
  }

  async disconnect(): Promise<void> {
    logger.info("OKXAdapter", "Disconnecting");
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

    logger.info("OKXAdapter", `Connecting to WS: ${OKX_WS_URL}`);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(OKX_WS_URL);

      this.ws.on("open", () => {
        logger.info("OKXAdapter", "WebSocket connected, sending subscriptions");
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
          logger.error("OKXAdapter", "Failed to parse message", err);
        }
      });

      this.ws.on("close", (code: number, reason: Buffer) => {
        logger.warn("OKXAdapter", `WebSocket closed: ${code} ${reason.toString()}`);
        this.connected = false;
        this.scheduleReconnect();
      });

      this.ws.on("error", (err: Error) => {
        logger.error("OKXAdapter", "WebSocket error", err.message);
        this.emit("error", err);
        if (!this.connected) reject(err);
      });
    });
  }

  private subscribe(): void {
    if (!this.ws || !this.config) return;

    const args: OKXSubscribeArg[] = [];

    if (this.config.enableTrades) {
      for (const symbol of this.config.symbols) {
        args.push({ channel: "trades", instId: toOKXInstId(symbol) });
      }
    }

    if (this.config.enableLiquidations) {
      args.push({ channel: "liquidation-orders", instType: "SWAP" });
    }

    if (args.length > 0) {
      const msg = JSON.stringify({ op: "subscribe", args });
      this.ws.send(msg);
      logger.info("OKXAdapter", `Subscribed to ${args.length} channels`);
    }
  }

  private handleMessage(msg: OKXWsMessage): void {
    this.lastEventTime = Date.now();

    // Ignore subscription confirmations
    if (msg.event) return;

    const arg = msg.arg;
    if (!arg?.channel) return;

    if (arg.channel === "trades" && msg.data) {
      this.handleTrades(msg.data as OKXTrade[]);
    } else if (arg.channel === "liquidation-orders" && msg.data) {
      this.handleLiquidations(msg.data as OKXLiquidation[]);
    }
  }

  // ─── Event Handlers ───────────────────────────────────────

  private handleTrades(trades: OKXTrade[]): void {
    for (const t of trades) {
      const canonicalSymbol = fromOKXInstId(t.instId);

      // Filter to only configured symbols
      if (this.config && !this.config.symbols.includes(canonicalSymbol)) continue;

      const trade: MarketTrade = {
        exchange: this.name,
        symbol: canonicalSymbol,
        price: parseFloat(t.px),
        quantity: parseFloat(t.sz),
        isBuyer: t.side === "buy",
        tradeId: `okx-${t.tradeId}`,
        timestamp: new Date(parseInt(t.ts)),
      };
      this.emit("trade", trade);
    }
  }

  private handleLiquidations(liquidations: OKXLiquidation[]): void {
    for (const l of liquidations) {
      const canonicalSymbol = fromOKXInstId(l.instId);

      // Filter to only configured symbols
      if (this.config && !this.config.symbols.includes(canonicalSymbol)) continue;

      for (const detail of l.details) {
        const price = parseFloat(detail.bkPx);
        const qty = parseFloat(detail.sz);
        const liq: LiquidationEvent = {
          exchange: this.name,
          symbol: canonicalSymbol,
          side: detail.side === "buy" ? "SHORT" : "LONG",
          quantity: qty,
          price,
          valueUsd: price * qty,
          timestamp: new Date(parseInt(detail.ts)),
        };
        this.emit("liquidation", liq);
      }
    }
  }

  // ─── REST Polling ─────────────────────────────────────────

  private startOIPoll(): void {
    const poll = async () => {
      if (!this.config) return;
      for (const symbol of this.config.symbols) {
        try {
          const instId = toOKXInstId(symbol);
          const res = await fetch(
            `${OKX_REST_BASE}/api/v5/public/open-interest?instId=${instId}&instType=SWAP`
          );
          const json = (await res.json()) as OKXRestResponse<OKXOpenInterest>;

          if (json.code !== "0" || !json.data?.[0]) continue;

          const data = json.data[0];
          const oi: OISnapshot = {
            exchange: this.name,
            symbol,
            value: parseFloat(data.oi),
            timestamp: new Date(parseInt(data.ts)),
          };
          this.emit("oi", oi);
          this.lastEventTime = Date.now();
        } catch (err) {
          logger.error("OKXAdapter", `OI poll failed for ${symbol}`, err);
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
          const instId = toOKXInstId(symbol);
          const res = await fetch(
            `${OKX_REST_BASE}/api/v5/public/funding-rate?instId=${instId}`
          );
          const json = (await res.json()) as OKXRestResponse<OKXFundingRate>;

          if (json.code !== "0" || !json.data?.[0]) continue;

          const data = json.data[0];
          const funding: FundingSnapshot = {
            exchange: this.name,
            symbol,
            rate: parseFloat(data.fundingRate),
            predictedRate: data.nextFundingRate
              ? parseFloat(data.nextFundingRate)
              : null,
            nextFundingTime: data.nextFundingTime
              ? new Date(parseInt(data.nextFundingTime))
              : null,
            timestamp: new Date(parseInt(data.fundingTime)),
          };
          this.emit("funding", funding);
          this.lastEventTime = Date.now();
        } catch (err) {
          logger.error("OKXAdapter", `Funding poll failed for ${symbol}`, err);
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
      logger.error("OKXAdapter", "Max reconnect attempts reached");
      this.emit("error", new Error("Max reconnect attempts reached"));
      return;
    }

    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, this.reconnectAttempt),
      maxDelay
    );

    this.reconnectAttempt++;
    this.reconnectCount++;

    logger.info("OKXAdapter", `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
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

// ─── OKX API Types ─────────────────────────────────────────

interface OKXSubscribeArg {
  channel: string;
  instId?: string;
  instType?: string;
}

interface OKXWsMessage {
  event?: string;
  arg?: { channel: string; instId?: string };
  data?: unknown[];
}

interface OKXTrade {
  instId: string;
  tradeId: string;
  px: string;      // Price
  sz: string;      // Size
  side: string;    // buy/sell
  ts: string;      // Timestamp ms
}

interface OKXLiquidation {
  instId: string;
  details: OKXLiquidationDetail[];
}

interface OKXLiquidationDetail {
  side: string;    // buy/sell
  bkPx: string;   // Bankruptcy price
  sz: string;      // Size
  ts: string;      // Timestamp
}

interface OKXRestResponse<T> {
  code: string;
  data: T[];
}

interface OKXOpenInterest {
  instId: string;
  oi: string;      // Open interest in contracts
  ts: string;      // Timestamp
}

interface OKXFundingRate {
  instId: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
}
