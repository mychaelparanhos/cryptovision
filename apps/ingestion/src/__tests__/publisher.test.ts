import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @upstash/redis
const mockSet = vi.fn().mockResolvedValue("OK");
const mockPublish = vi.fn().mockResolvedValue(1);
const mockMget = vi.fn().mockResolvedValue([]);
const mockZadd = vi.fn().mockResolvedValue(1);
const mockZcard = vi.fn().mockResolvedValue(1);
const mockZremrangebyrank = vi.fn().mockResolvedValue(0);
const mockExpire = vi.fn().mockResolvedValue(1);

vi.mock("@upstash/redis", () => {
  return {
    Redis: class MockRedis {
      set = mockSet;
      publish = mockPublish;
      mget = mockMget;
      zadd = mockZadd;
      zcard = mockZcard;
      zremrangebyrank = mockZremrangebyrank;
      expire = mockExpire;
    },
  };
});

import { Publisher } from "../services/publisher";
import type { FundingSnapshot, OISnapshot, LiquidationEvent } from "@cryptovision/shared";

describe("Publisher", () => {
  let publisher: Publisher;

  beforeEach(() => {
    vi.clearAllMocks();
    publisher = new Publisher("https://fake.upstash.io", "fake-token");
  });

  describe("publishFunding", () => {
    const event: FundingSnapshot = {
      exchange: "binance",
      symbol: "BTCUSDT",
      rate: 0.0001,
      predictedRate: 0.00012,
      nextFundingTime: new Date("2026-04-16T08:00:00Z"),
      timestamp: new Date("2026-04-16T07:00:00Z"),
    };

    it("writes per-exchange cache key", async () => {
      mockMget.mockResolvedValueOnce([]);
      await publisher.publishFunding(event);

      expect(mockSet).toHaveBeenCalledWith(
        "cv:cache:funding:binance:BTCUSDT",
        expect.any(String),
        { ex: 900 }
      );
    });

    it("publishes to cv:funding PUB/SUB channel", async () => {
      mockMget.mockResolvedValueOnce([]);
      await publisher.publishFunding(event);

      expect(mockPublish).toHaveBeenCalledWith(
        "cv:funding",
        expect.any(String)
      );
    });

    it("writes cv:latest:funding for SSE endpoint", async () => {
      mockMget.mockResolvedValueOnce([]);
      await publisher.publishFunding(event);

      expect(mockSet).toHaveBeenCalledWith(
        "cv:latest:funding",
        expect.any(String),
        { ex: 30 }
      );
    });

    it("computes aggregated funding from multiple exchanges", async () => {
      const binanceData = JSON.stringify({
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.0001,
        nextFundingTime: "2026-04-16T08:00:00Z",
      });
      const bybitData = JSON.stringify({
        exchange: "bybit",
        symbol: "BTCUSDT",
        rate: 0.0003,
        nextFundingTime: "2026-04-16T08:00:00Z",
      });

      // When updateAggregatedFunding calls mget for 3 exchanges
      mockMget.mockResolvedValueOnce([binanceData, bybitData, null]);

      await publisher.publishFunding(event);

      // Should write aggregated key with average rate
      const aggCall = mockSet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("agg:")
      );
      expect(aggCall).toBeDefined();
      const aggData = JSON.parse(aggCall![1] as string);
      // Average of 0.0001 and 0.0003 = 0.0002
      expect(aggData.rate).toBeCloseTo(0.0002, 6);
      expect(aggData.sources).toEqual(["binance", "bybit"]);
    });
  });

  describe("publishOI", () => {
    const event: OISnapshot = {
      exchange: "binance",
      symbol: "BTCUSDT",
      value: 1500000000,
      timestamp: new Date("2026-04-16T07:00:00Z"),
    };

    it("writes per-exchange OI cache key", async () => {
      mockMget.mockResolvedValueOnce([]);
      await publisher.publishOI(event);

      expect(mockSet).toHaveBeenCalledWith(
        "cv:cache:oi:binance:BTCUSDT",
        expect.any(String),
        { ex: 900 }
      );
    });

    it("computes aggregated OI as sum across exchanges", async () => {
      const binanceOI = JSON.stringify({
        exchange: "binance",
        symbol: "BTCUSDT",
        value: 1500000000,
      });
      const bybitOI = JSON.stringify({
        exchange: "bybit",
        symbol: "BTCUSDT",
        value: 800000000,
      });

      mockMget.mockResolvedValueOnce([binanceOI, bybitOI, null]);

      await publisher.publishOI(event);

      const aggCall = mockSet.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("oi:agg:")
      );
      expect(aggCall).toBeDefined();
      const aggData = JSON.parse(aggCall![1] as string);
      // Sum: 1.5B + 0.8B = 2.3B
      expect(aggData.value).toBe(2300000000);
      expect(aggData.sources).toEqual(["binance", "bybit"]);
    });
  });

  describe("publishLiquidation", () => {
    const event: LiquidationEvent = {
      exchange: "binance",
      symbol: "BTCUSDT",
      side: "LONG",
      quantity: 1.5,
      price: 65000,
      valueUsd: 97500,
      timestamp: new Date("2026-04-16T07:00:00Z"),
    };

    it("writes per-exchange liquidation cache key", async () => {
      await publisher.publishLiquidation(event);

      expect(mockSet).toHaveBeenCalledWith(
        expect.stringContaining("cv:cache:liq:binance:BTCUSDT:"),
        expect.any(String),
        { ex: 900 }
      );
    });

    it("appends to aggregated liquidation sorted set", async () => {
      await publisher.publishLiquidation(event);

      expect(mockZadd).toHaveBeenCalledWith(
        "cv:cache:liq:agg:BTCUSDT:latest",
        { score: 97500, member: expect.any(String) }
      );
    });

    it("writes cv:latest:liquidations for SSE", async () => {
      await publisher.publishLiquidation(event);

      expect(mockSet).toHaveBeenCalledWith(
        "cv:latest:liquidations",
        expect.any(String),
        { ex: 30 }
      );
    });
  });
});
