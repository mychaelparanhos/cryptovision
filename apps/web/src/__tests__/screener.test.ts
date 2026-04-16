import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the redis module
const mockMget = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    mget: mockMget,
  })),
}));

// Mock @cryptovision/shared
vi.mock("@cryptovision/shared", () => ({
  SUPPORTED_SYMBOLS: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
}));

describe("Screener API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns aggregated data from MGET", async () => {
    const fundingAgg = JSON.stringify({
      exchange: "aggregated",
      symbol: "BTCUSDT",
      rate: 0.0002,
      sources: ["binance", "bybit"],
    });
    const oiAgg = JSON.stringify({
      exchange: "aggregated",
      symbol: "BTCUSDT",
      value: 2300000000,
      sources: ["binance", "bybit"],
    });

    // First mget call = funding keys, second = OI keys
    mockMget
      .mockResolvedValueOnce([fundingAgg, null, null]) // funding for 3 symbols
      .mockResolvedValueOnce([oiAgg, null, null]); // OI for 3 symbols

    // Import and call the route handler
    const { GET } = await import(
      "../app/api/v1/public/screener/route"
    );
    const response = await GET();
    const json = await response.json();

    expect(json.data).toHaveLength(1); // Only BTCUSDT has data
    expect(json.data[0].symbol).toBe("BTCUSDT");
    expect(json.data[0].funding.rate).toBe(0.0002);
    expect(json.data[0].oi.value).toBe(2300000000);
    expect(json.meta.sources).toContain("binance");
    expect(json.meta.sources).toContain("bybit");
    expect(json.meta.exchange).toBe("aggregated");
  });

  it("returns empty array when no cache data", async () => {
    mockMget
      .mockResolvedValueOnce([null, null, null])
      .mockResolvedValueOnce([null, null, null]);

    const { GET } = await import(
      "../app/api/v1/public/screener/route"
    );
    const response = await GET();
    const json = await response.json();

    expect(json.data).toHaveLength(0);
    expect(json.meta.sources).toHaveLength(0);
  });

  it("uses MGET for batch reads (2 calls total, not N)", async () => {
    mockMget
      .mockResolvedValueOnce([null, null, null])
      .mockResolvedValueOnce([null, null, null]);

    const { GET } = await import(
      "../app/api/v1/public/screener/route"
    );
    await GET();

    // Should be exactly 2 MGET calls (funding + OI), not 6 individual GETs
    expect(mockMget).toHaveBeenCalledTimes(2);
  });
});
