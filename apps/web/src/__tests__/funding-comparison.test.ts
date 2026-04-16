import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis
const mockMget = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    mget: mockMget,
  })),
}));

// Mock shared symbols
vi.mock("@cryptovision/shared", () => ({
  SUPPORTED_SYMBOLS: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
}));

describe("Funding Comparison API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns comparison data with spread calculation", async () => {
    // 3 exchanges x 3 symbols = 9 keys
    // Order: binance-BTC, binance-ETH, binance-SOL, bybit-BTC, bybit-ETH, bybit-SOL, okx-BTC, okx-ETH, okx-SOL
    mockMget.mockResolvedValueOnce([
      JSON.stringify({ rate: 0.0001, predictedRate: 0.00012, nextFundingTime: "2026-04-16T08:00:00Z" }), // binance BTC
      JSON.stringify({ rate: 0.0002, predictedRate: null, nextFundingTime: null }), // binance ETH
      null, // binance SOL
      JSON.stringify({ rate: 0.0003, predictedRate: null, nextFundingTime: null }), // bybit BTC
      null, // bybit ETH
      null, // bybit SOL
      null, // okx BTC
      null, // okx ETH
      null, // okx SOL
    ]);

    const { GET } = await import("../app/api/v1/public/funding/comparison/route");
    const response = await GET();
    const json = await response.json();

    expect(json.data).toHaveLength(3);

    // BTC has binance=0.0001 and bybit=0.0003, spread=0.0002
    const btc = json.data.find((r: { symbol: string }) => r.symbol === "BTCUSDT");
    expect(btc).toBeDefined();
    expect(btc.exchanges.binance.rate).toBe(0.0001);
    expect(btc.exchanges.bybit.rate).toBe(0.0003);
    expect(btc.exchanges.okx.rate).toBeNull();
    expect(btc.spread).toBeCloseTo(0.0002, 8);
    expect(btc.signal).toBe("DIVERGENT"); // 0.0002 > 0.0001 threshold

    // ETH has only binance, no spread
    const eth = json.data.find((r: { symbol: string }) => r.symbol === "ETHUSDT");
    expect(eth.spread).toBe(0);
    expect(eth.signal).toBeNull();

    expect(json.meta.sources).toContain("binance");
    expect(json.meta.sources).toContain("bybit");
  });

  it("handles missing exchange data gracefully", async () => {
    // All null — no data
    mockMget.mockResolvedValueOnce(Array(9).fill(null));

    const { GET } = await import("../app/api/v1/public/funding/comparison/route");
    const response = await GET();
    const json = await response.json();

    expect(json.data).toHaveLength(3);
    // All spreads should be 0, no signals
    for (const row of json.data) {
      expect(row.spread).toBe(0);
      expect(row.signal).toBeNull();
    }
    expect(json.meta.sources).toHaveLength(0);
  });

  it("sorts by spread desc by default", async () => {
    mockMget.mockResolvedValueOnce([
      JSON.stringify({ rate: 0.0001 }), // binance BTC
      JSON.stringify({ rate: 0.0001 }), // binance ETH
      JSON.stringify({ rate: 0.0001 }), // binance SOL
      JSON.stringify({ rate: 0.0005 }), // bybit BTC (big spread)
      JSON.stringify({ rate: 0.0002 }), // bybit ETH (small spread)
      JSON.stringify({ rate: 0.0010 }), // bybit SOL (biggest spread)
      null, null, null, // no okx
    ]);

    const { GET } = await import("../app/api/v1/public/funding/comparison/route");
    const response = await GET();
    const json = await response.json();

    // Should be sorted: SOL (0.0009) > BTC (0.0004) > ETH (0.0001)
    expect(json.data[0].symbol).toBe("SOLUSDT");
    expect(json.data[1].symbol).toBe("BTCUSDT");
    expect(json.data[2].symbol).toBe("ETHUSDT");
  });

  it("uses single MGET call for all exchange-symbol combinations", async () => {
    mockMget.mockResolvedValueOnce(Array(9).fill(null));

    const { GET } = await import("../app/api/v1/public/funding/comparison/route");
    await GET();

    // Should be exactly 1 MGET call with 9 keys (3 exchanges x 3 symbols)
    expect(mockMget).toHaveBeenCalledTimes(1);
    expect(mockMget.mock.calls[0]).toHaveLength(9);
  });
});
