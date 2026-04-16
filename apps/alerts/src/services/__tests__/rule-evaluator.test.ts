import { describe, it, expect, beforeEach } from "vitest";
import type {
  AlertRule,
  FundingSnapshot,
  LiquidationEvent,
  OISnapshot,
} from "@cryptovision/shared";
import { RuleCache } from "../rule-cache";
import { RuleEvaluator } from "../rule-evaluator";

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: "rule-1",
    userId: "user-1",
    channelId: "channel-1",
    name: "Test Rule",
    type: "funding_rate",
    symbol: null,
    exchange: null,
    condition: { operator: "gt", value: 0.001 },
    active: true,
    lastFired: null,
    cooldownMin: 60,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("RuleEvaluator", () => {
  let cache: RuleCache;
  let evaluator: RuleEvaluator;

  beforeEach(() => {
    cache = new RuleCache(async () => []);
    evaluator = new RuleEvaluator(cache);
  });

  describe("evaluateCondition", () => {
    it("gt: returns true when value > threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "gt", value: 10 }, 15)).toBe(true);
    });

    it("gt: returns false when value <= threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "gt", value: 10 }, 10)).toBe(false);
      expect(evaluator.evaluateCondition({ operator: "gt", value: 10 }, 5)).toBe(false);
    });

    it("lt: returns true when value < threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "lt", value: 10 }, 5)).toBe(true);
    });

    it("gte: returns true when value >= threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "gte", value: 10 }, 10)).toBe(true);
      expect(evaluator.evaluateCondition({ operator: "gte", value: 10 }, 15)).toBe(true);
    });

    it("lte: returns true when value <= threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "lte", value: 10 }, 10)).toBe(true);
      expect(evaluator.evaluateCondition({ operator: "lte", value: 10 }, 5)).toBe(true);
    });

    it("eq: returns true when value === threshold", () => {
      expect(evaluator.evaluateCondition({ operator: "eq", value: 10 }, 10)).toBe(true);
      expect(evaluator.evaluateCondition({ operator: "eq", value: 10 }, 11)).toBe(false);
    });
  });

  describe("evaluateFunding", () => {
    it("matches funding rule when condition is met", async () => {
      const rule = makeRule({
        type: "funding_rate",
        condition: { operator: "gt", value: 0.001 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: FundingSnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.005,
        predictedRate: null,
        nextFundingTime: null,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateFunding(event);
      expect(matches).toHaveLength(1);
      expect(matches[0].eventType).toBe("funding_rate");
      expect(matches[0].value).toBe(0.005);
    });

    it("does not match when condition is not met", async () => {
      const rule = makeRule({
        type: "funding_rate",
        condition: { operator: "gt", value: 0.01 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: FundingSnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.005,
        predictedRate: null,
        nextFundingTime: null,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateFunding(event);
      expect(matches).toHaveLength(0);
    });

    it("filters by symbol when rule has symbol set", async () => {
      const rule = makeRule({
        type: "funding_rate",
        symbol: "ETHUSDT",
        condition: { operator: "gt", value: 0.001 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: FundingSnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.005,
        predictedRate: null,
        nextFundingTime: null,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateFunding(event);
      expect(matches).toHaveLength(0); // Different symbol
    });
  });

  describe("evaluateLiquidation", () => {
    it("matches liquidation rule when value exceeds threshold", async () => {
      const rule = makeRule({
        id: "liq-rule-1",
        type: "liquidation_size",
        condition: { operator: "gt", value: 100000 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: LiquidationEvent = {
        exchange: "binance",
        symbol: "BTCUSDT",
        side: "LONG",
        quantity: 5,
        price: 65000,
        valueUsd: 325000,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateLiquidation(event);
      expect(matches).toHaveLength(1);
      expect(matches[0].value).toBe(325000);
    });
  });

  describe("evaluateOI", () => {
    it("matches OI change rule when change exceeds threshold", async () => {
      const rule = makeRule({
        id: "oi-rule-1",
        type: "oi_change_pct",
        condition: { operator: "gt", value: 5 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: OISnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        value: 110000,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateOI(event, 100000); // 10% change
      expect(matches).toHaveLength(1);
      expect(matches[0].value).toBeCloseTo(10, 1);
    });

    it("returns empty when no previous OI value", async () => {
      const rule = makeRule({
        id: "oi-rule-2",
        type: "oi_change_pct",
        condition: { operator: "gt", value: 5 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: OISnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        value: 110000,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateOI(event);
      expect(matches).toHaveLength(0);
    });
  });

  describe("cooldown enforcement", () => {
    it("prevents duplicate alerts within cooldown period", async () => {
      const rule = makeRule({
        type: "funding_rate",
        cooldownMin: 60,
        condition: { operator: "gt", value: 0.001 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: FundingSnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.005,
        predictedRate: null,
        nextFundingTime: null,
        timestamp: new Date(),
      };

      // First evaluation should match
      const first = evaluator.evaluateFunding(event);
      expect(first).toHaveLength(1);

      // Second evaluation within cooldown should NOT match
      const second = evaluator.evaluateFunding(event);
      expect(second).toHaveLength(0);
    });
  });

  describe("message formatting", () => {
    it("includes all required fields in funding alert message", async () => {
      const rule = makeRule({
        type: "funding_rate",
        condition: { operator: "gt", value: 0.001 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: FundingSnapshot = {
        exchange: "binance",
        symbol: "BTCUSDT",
        rate: 0.005,
        predictedRate: null,
        nextFundingTime: null,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateFunding(event);
      expect(matches).toHaveLength(1);
      const msg = matches[0].message;
      expect(msg).toContain("BTCUSDT");
      expect(msg).toContain("BINANCE");
      expect(msg).toContain("Funding Rate Alert");
      expect(msg).toContain("0.5000%");
    });

    it("includes all required fields in liquidation alert message", async () => {
      const rule = makeRule({
        id: "liq-msg-rule",
        type: "liquidation_size",
        condition: { operator: "gt", value: 100000 },
      });
      cache = new RuleCache(async () => [rule]);
      await cache.start();
      evaluator = new RuleEvaluator(cache);

      const event: LiquidationEvent = {
        exchange: "bybit",
        symbol: "ETHUSDT",
        side: "SHORT",
        quantity: 100,
        price: 3200,
        valueUsd: 320000,
        timestamp: new Date(),
      };

      const matches = evaluator.evaluateLiquidation(event);
      expect(matches).toHaveLength(1);
      const msg = matches[0].message;
      expect(msg).toContain("ETHUSDT");
      expect(msg).toContain("BYBIT");
      expect(msg).toContain("SHORT");
      expect(msg).toContain("Liquidation Alert");
      expect(msg).toContain("$320.0K");
    });
  });
});
