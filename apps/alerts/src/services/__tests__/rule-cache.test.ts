import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AlertRule } from "@cryptovision/shared";
import { RuleCache } from "../rule-cache";

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

describe("RuleCache", () => {
  let loader: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loader = vi.fn();
  });

  it("loads rules on start", async () => {
    const rules = [
      makeRule({ id: "r1", type: "funding_rate" }),
      makeRule({ id: "r2", type: "liquidation_size" }),
    ];
    loader.mockResolvedValue(rules);

    const cache = new RuleCache(loader);
    await cache.start();

    expect(cache.getRuleCount()).toBe(2);
    expect(cache.getAllRules()).toHaveLength(2);
    cache.stop();
  });

  it("groups rules by type", async () => {
    const rules = [
      makeRule({ id: "r1", type: "funding_rate" }),
      makeRule({ id: "r2", type: "funding_rate" }),
      makeRule({ id: "r3", type: "liquidation_size" }),
      makeRule({ id: "r4", type: "oi_change_pct" }),
    ];
    loader.mockResolvedValue(rules);

    const cache = new RuleCache(loader);
    await cache.start();

    expect(cache.getRulesByType("funding_rate")).toHaveLength(2);
    expect(cache.getRulesByType("liquidation_size")).toHaveLength(1);
    expect(cache.getRulesByType("oi_change_pct")).toHaveLength(1);
    expect(cache.getRulesByType("whale_trade")).toHaveLength(0);
    cache.stop();
  });

  it("refreshes rules from loader", async () => {
    loader.mockResolvedValueOnce([makeRule({ id: "r1" })]);
    const cache = new RuleCache(loader);
    await cache.start();

    expect(cache.getRuleCount()).toBe(1);

    // Simulate refresh with new data
    loader.mockResolvedValueOnce([
      makeRule({ id: "r1" }),
      makeRule({ id: "r2" }),
    ]);
    await cache.refresh();

    expect(cache.getRuleCount()).toBe(2);
    cache.stop();
  });

  it("handles loader errors gracefully", async () => {
    loader.mockResolvedValueOnce([makeRule({ id: "r1" })]);
    const cache = new RuleCache(loader);
    await cache.start();

    expect(cache.getRuleCount()).toBe(1);

    // Error during refresh should keep old data
    loader.mockRejectedValueOnce(new Error("DB connection failed"));
    await cache.refresh();

    expect(cache.getRuleCount()).toBe(1); // Still has old data
    cache.stop();
  });

  it("returns empty array for unknown type", async () => {
    loader.mockResolvedValue([]);
    const cache = new RuleCache(loader);
    await cache.start();

    expect(cache.getRulesByType("funding_rate")).toEqual([]);
    cache.stop();
  });
});
