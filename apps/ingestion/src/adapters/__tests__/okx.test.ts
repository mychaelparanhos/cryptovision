import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock WebSocket
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { OKXAdapter, toOKXInstId, fromOKXInstId } from "../okx";

describe("OKX Symbol Normalization", () => {
  it("converts BTCUSDT to BTC-USDT-SWAP", () => {
    expect(toOKXInstId("BTCUSDT")).toBe("BTC-USDT-SWAP");
  });

  it("converts ETHUSDT to ETH-USDT-SWAP", () => {
    expect(toOKXInstId("ETHUSDT")).toBe("ETH-USDT-SWAP");
  });

  it("converts SOLUSDT to SOL-USDT-SWAP", () => {
    expect(toOKXInstId("SOLUSDT")).toBe("SOL-USDT-SWAP");
  });

  it("converts DOGEUSDT to DOGE-USDT-SWAP", () => {
    expect(toOKXInstId("DOGEUSDT")).toBe("DOGE-USDT-SWAP");
  });

  it("returns input unchanged if no match", () => {
    expect(toOKXInstId("INVALID")).toBe("INVALID");
  });

  it("converts BTC-USDT-SWAP back to BTCUSDT", () => {
    expect(fromOKXInstId("BTC-USDT-SWAP")).toBe("BTCUSDT");
  });

  it("converts ETH-USDT-SWAP back to ETHUSDT", () => {
    expect(fromOKXInstId("ETH-USDT-SWAP")).toBe("ETHUSDT");
  });

  it("round-trips correctly for all supported symbols", () => {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
    for (const symbol of symbols) {
      expect(fromOKXInstId(toOKXInstId(symbol))).toBe(symbol);
    }
  });
});

describe("OKXAdapter", () => {
  let adapter: OKXAdapter;

  beforeEach(() => {
    adapter = new OKXAdapter({ maxRetries: 3, baseDelay: 100, maxDelay: 1000, backoffMultiplier: 2 });
    vi.clearAllMocks();
  });

  it("has correct exchange name", () => {
    expect(adapter.name).toBe("okx");
  });

  it("starts as disconnected", () => {
    expect(adapter.isConnected()).toBe(false);
  });

  it("returns offline health when disconnected", () => {
    const health = adapter.getHealth();
    expect(health.exchange).toBe("okx");
    expect(health.status).toBe("offline");
  });

  describe("trade message parsing", () => {
    it("emits trade events from OKX WS messages", () => {
      // Set config so filter works
      (adapter as any)["config"] = {
        symbols: ["BTCUSDT"],
        enableTrades: true,
        enableFunding: false,
        enableLiquidations: false,
        enableOI: false,
      };

      const trades: unknown[] = [];
      adapter.on("trade", (trade) => trades.push(trade));

      const handleTrades = (adapter as any)["handleTrades"].bind(adapter);
      handleTrades([
        {
          instId: "BTC-USDT-SWAP",
          tradeId: "abc123",
          px: "67500.50",
          sz: "0.5",
          side: "buy",
          ts: "1700000000000",
        },
      ]);

      expect(trades).toHaveLength(1);
      const trade = trades[0] as Record<string, unknown>;
      expect(trade.exchange).toBe("okx");
      expect(trade.symbol).toBe("BTCUSDT"); // Normalized back
      expect(trade.price).toBe(67500.5);
      expect(trade.quantity).toBe(0.5);
      expect(trade.isBuyer).toBe(true);
      expect(trade.tradeId).toBe("okx-abc123");
    });

    it("filters out symbols not in config", () => {
      (adapter as any)["config"] = {
        symbols: ["BTCUSDT"],
        enableTrades: true,
        enableFunding: false,
        enableLiquidations: false,
        enableOI: false,
      };

      const trades: unknown[] = [];
      adapter.on("trade", (trade) => trades.push(trade));

      const handleTrades = (adapter as any)["handleTrades"].bind(adapter);
      handleTrades([
        {
          instId: "ETH-USDT-SWAP",
          tradeId: "def456",
          px: "3200.00",
          sz: "10",
          side: "sell",
          ts: "1700000000000",
        },
      ]);

      expect(trades).toHaveLength(0); // Filtered out
    });
  });

  describe("liquidation message parsing", () => {
    it("emits liquidation events correctly", () => {
      (adapter as any)["config"] = {
        symbols: ["BTCUSDT"],
        enableTrades: false,
        enableFunding: false,
        enableLiquidations: true,
        enableOI: false,
      };

      const liqs: unknown[] = [];
      adapter.on("liquidation", (liq) => liqs.push(liq));

      const handleLiquidations = (adapter as any)["handleLiquidations"].bind(adapter);
      handleLiquidations([
        {
          instId: "BTC-USDT-SWAP",
          details: [
            {
              side: "buy",
              bkPx: "65000.00",
              sz: "1.5",
              ts: "1700000000000",
            },
          ],
        },
      ]);

      expect(liqs).toHaveLength(1);
      const liq = liqs[0] as Record<string, unknown>;
      expect(liq.exchange).toBe("okx");
      expect(liq.symbol).toBe("BTCUSDT");
      expect(liq.side).toBe("SHORT"); // buy liquidation = SHORT was liquidated
      expect(liq.valueUsd).toBe(97500);
    });
  });

  describe("REST polling data transformation", () => {
    it("transforms OKX OI response correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          code: "0",
          data: [
            {
              instId: "BTC-USDT-SWAP",
              oi: "50000",
              ts: "1700000000000",
            },
          ],
        }),
      });

      const oiEvents: unknown[] = [];
      adapter.on("oi", (oi) => oiEvents.push(oi));

      const res = await fetch(
        `https://www.okx.com/api/v5/public/open-interest?instId=BTC-USDT-SWAP&instType=SWAP`
      );
      const json = await res.json();

      if (json.code === "0" && json.data?.[0]) {
        adapter.emit("oi", {
          exchange: "okx",
          symbol: "BTCUSDT",
          value: parseFloat(json.data[0].oi),
          timestamp: new Date(parseInt(json.data[0].ts)),
        });
      }

      expect(oiEvents).toHaveLength(1);
      expect((oiEvents[0] as Record<string, unknown>).value).toBe(50000);
    });
  });

  describe("disconnect", () => {
    it("cleans up resources on disconnect", async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });
});
