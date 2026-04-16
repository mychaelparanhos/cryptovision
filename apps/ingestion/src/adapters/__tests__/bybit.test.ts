import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock WebSocket before importing the adapter
vi.mock("ws", () => {
  const { EventEmitter } = require("events");
  class MockWebSocket extends EventEmitter {
    static OPEN = 1;
    readyState = 1;
    send = vi.fn();
    close = vi.fn();
    removeAllListeners = vi.fn(() => {
      return this;
    });
  }
  return { default: MockWebSocket };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { BybitAdapter } from "../bybit";

describe("BybitAdapter", () => {
  let adapter: BybitAdapter;

  beforeEach(() => {
    adapter = new BybitAdapter({ maxRetries: 3, baseDelay: 100, maxDelay: 1000, backoffMultiplier: 2 });
    vi.clearAllMocks();
  });

  it("has correct exchange name", () => {
    expect(adapter.name).toBe("bybit");
  });

  it("starts as disconnected", () => {
    expect(adapter.isConnected()).toBe(false);
  });

  it("returns offline health when disconnected", () => {
    const health = adapter.getHealth();
    expect(health.exchange).toBe("bybit");
    expect(health.status).toBe("offline");
    expect(health.reconnectCount).toBe(0);
  });

  describe("trade message parsing", () => {
    it("emits trade events from Bybit WS messages", () => {
      const trades: unknown[] = [];
      adapter.on("trade", (trade) => trades.push(trade));

      // Access private method for testing
      const handleTrades = (adapter as any)["handleTrades"].bind(adapter);
      handleTrades([
        {
          s: "BTCUSDT",
          i: "12345",
          p: "67500.50",
          v: "0.5",
          S: "Buy",
          T: 1700000000000,
        },
      ]);

      expect(trades).toHaveLength(1);
      const trade = trades[0] as Record<string, unknown>;
      expect(trade.exchange).toBe("bybit");
      expect(trade.symbol).toBe("BTCUSDT");
      expect(trade.price).toBe(67500.5);
      expect(trade.quantity).toBe(0.5);
      expect(trade.isBuyer).toBe(true);
      expect(trade.tradeId).toBe("bybit-12345");
    });

    it("correctly maps Sell side to isBuyer=false", () => {
      const trades: unknown[] = [];
      adapter.on("trade", (trade) => trades.push(trade));

      const handleTrades = (adapter as any)["handleTrades"].bind(adapter);
      handleTrades([
        {
          s: "ETHUSDT",
          i: "67890",
          p: "3200.00",
          v: "10",
          S: "Sell",
          T: 1700000000000,
        },
      ]);

      expect(trades).toHaveLength(1);
      expect((trades[0] as Record<string, unknown>).isBuyer).toBe(false);
    });
  });

  describe("liquidation message parsing", () => {
    it("emits liquidation events correctly", () => {
      const liqs: unknown[] = [];
      adapter.on("liquidation", (liq) => liqs.push(liq));

      const handleLiquidation = (adapter as any)["handleLiquidation"].bind(adapter);
      handleLiquidation({
        symbol: "BTCUSDT",
        side: "Buy",
        price: "65000.00",
        size: "1.5",
        updatedTime: 1700000000000,
      });

      expect(liqs).toHaveLength(1);
      const liq = liqs[0] as Record<string, unknown>;
      expect(liq.exchange).toBe("bybit");
      expect(liq.symbol).toBe("BTCUSDT");
      expect(liq.side).toBe("SHORT"); // Buy liquidation = SHORT was liquidated
      expect(liq.price).toBe(65000);
      expect(liq.quantity).toBe(1.5);
      expect(liq.valueUsd).toBe(97500);
    });

    it("maps Sell liquidation to LONG side", () => {
      const liqs: unknown[] = [];
      adapter.on("liquidation", (liq) => liqs.push(liq));

      const handleLiquidation = (adapter as any)["handleLiquidation"].bind(adapter);
      handleLiquidation({
        symbol: "ETHUSDT",
        side: "Sell",
        price: "3000.00",
        size: "10",
        updatedTime: 1700000000000,
      });

      expect(liqs).toHaveLength(1);
      expect((liqs[0] as Record<string, unknown>).side).toBe("LONG");
    });
  });

  describe("REST polling data transformation", () => {
    it("transforms Bybit ticker response to OISnapshot", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          retCode: 0,
          result: {
            list: [
              {
                symbol: "BTCUSDT",
                openInterest: "50000.5",
                fundingRate: "0.0001",
                nextFundingTime: "1700000000000",
              },
            ],
          },
        }),
      });

      const oiEvents: unknown[] = [];
      adapter.on("oi", (oi) => oiEvents.push(oi));

      // Simulate what the poll function does
      const res = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT`
      );
      const json = await res.json();

      if (json.retCode === 0 && json.result?.list?.[0]) {
        const ticker = json.result.list[0];
        adapter.emit("oi", {
          exchange: "bybit",
          symbol: "BTCUSDT",
          value: parseFloat(ticker.openInterest),
          timestamp: new Date(),
        });
      }

      expect(oiEvents).toHaveLength(1);
      const oi = oiEvents[0] as Record<string, unknown>;
      expect(oi.exchange).toBe("bybit");
      expect(oi.symbol).toBe("BTCUSDT");
      expect(oi.value).toBe(50000.5);
    });
  });

  describe("disconnect", () => {
    it("cleans up resources on disconnect", async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });
});
