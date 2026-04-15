import type { MarketTrade, OHLCVCandle, ExchangeName } from "@cryptovision/shared";
import { logger } from "../utils/logger";

interface CandleBuffer {
  open: number;
  high: number;
  low: number;
  close: number;
  volumeBuy: number;
  volumeSell: number;
  count: number;
}

type CandleCallback = (candle: OHLCVCandle) => void;

export class TradeAggregator {
  private buffers = new Map<string, CandleBuffer>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private callback: CandleCallback;
  private currentSecond = 0;

  constructor(callback: CandleCallback) {
    this.callback = callback;
  }

  start(): void {
    this.currentSecond = Math.floor(Date.now() / 1000);
    this.timer = setInterval(() => this.flush(), 1000);
    logger.info("Aggregator", "Started 1s OHLCV aggregation");
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush(); // Flush remaining
    this.buffers.clear();
    logger.info("Aggregator", "Stopped");
  }

  addTrade(trade: MarketTrade): void {
    const key = `${trade.exchange}:${trade.symbol}`;
    let buf = this.buffers.get(key);

    if (!buf) {
      buf = {
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volumeBuy: 0,
        volumeSell: 0,
        count: 0,
      };
      this.buffers.set(key, buf);
    }

    buf.high = Math.max(buf.high, trade.price);
    buf.low = Math.min(buf.low, trade.price);
    buf.close = trade.price;
    buf.count++;

    if (trade.isBuyer) {
      buf.volumeBuy += trade.quantity;
    } else {
      buf.volumeSell += trade.quantity;
    }
  }

  private flush(): void {
    const ts = new Date(this.currentSecond * 1000);
    this.currentSecond = Math.floor(Date.now() / 1000);

    for (const [key, buf] of this.buffers) {
      const [exchange, symbol] = key.split(":");
      const candle: OHLCVCandle = {
        exchange: exchange as ExchangeName,
        symbol,
        open: buf.open,
        high: buf.high,
        low: buf.low,
        close: buf.close,
        volumeBuy: buf.volumeBuy,
        volumeSell: buf.volumeSell,
        count: buf.count,
        timestamp: ts,
      };
      this.callback(candle);
    }

    this.buffers.clear();
  }
}
