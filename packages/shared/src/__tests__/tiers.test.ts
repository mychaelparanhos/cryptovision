import { describe, it, expect } from "vitest";
import { hasTierAccess, TIER_LIMITS, TIER_ORDER } from "../constants/tiers";

describe("hasTierAccess", () => {
  it("grants access when user tier equals required tier", () => {
    expect(hasTierAccess("free", "free")).toBe(true);
    expect(hasTierAccess("starter", "starter")).toBe(true);
    expect(hasTierAccess("pro", "pro")).toBe(true);
  });

  it("grants access when user tier is higher than required", () => {
    expect(hasTierAccess("pro", "free")).toBe(true);
    expect(hasTierAccess("enterprise", "starter")).toBe(true);
    expect(hasTierAccess("starter", "lite")).toBe(true);
  });

  it("denies access when user tier is lower than required", () => {
    expect(hasTierAccess("free", "lite")).toBe(false);
    expect(hasTierAccess("lite", "pro")).toBe(false);
    expect(hasTierAccess("starter", "enterprise")).toBe(false);
  });

  it("free tier has no access to any paid tier", () => {
    expect(hasTierAccess("free", "lite")).toBe(false);
    expect(hasTierAccess("free", "starter")).toBe(false);
    expect(hasTierAccess("free", "pro")).toBe(false);
    expect(hasTierAccess("free", "enterprise")).toBe(false);
  });

  it("enterprise tier has access to everything", () => {
    for (const tier of TIER_ORDER) {
      expect(hasTierAccess("enterprise", tier)).toBe(true);
    }
  });
});

describe("TIER_LIMITS", () => {
  it("has all 5 tiers defined", () => {
    expect(Object.keys(TIER_LIMITS)).toHaveLength(5);
    expect(TIER_LIMITS.free).toBeDefined();
    expect(TIER_LIMITS.lite).toBeDefined();
    expect(TIER_LIMITS.starter).toBeDefined();
    expect(TIER_LIMITS.pro).toBeDefined();
    expect(TIER_LIMITS.enterprise).toBeDefined();
  });

  it("free tier has $0 price and no real-time features", () => {
    expect(TIER_LIMITS.free.monthlyPrice).toBe(0);
    expect(TIER_LIMITS.free.wsSymbols).toBe(0);
    expect(TIER_LIMITS.free.maxAlerts).toBe(0);
  });

  it("prices increase monotonically", () => {
    const prices = TIER_ORDER.map((t) => TIER_LIMITS[t].monthlyPrice);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    }
  });
});

describe("TIER_ORDER", () => {
  it("has correct order from free to enterprise", () => {
    expect(TIER_ORDER).toEqual(["free", "lite", "starter", "pro", "enterprise"]);
  });
});
