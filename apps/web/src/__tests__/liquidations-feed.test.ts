import { describe, it, expect, vi, beforeEach } from "vitest";

const mockZrange = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    zrange: mockZrange,
  })),
}));

vi.mock("@cryptovision/shared", () => ({
  SUPPORTED_SYMBOLS: ["BTCUSDT", "ETHUSDT"],
}));

describe("Liquidations Feed API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns liquidations sorted by valueUsd desc", async () => {
    // BTC liquidations
    mockZrange.mockResolvedValueOnce([
      JSON.stringify({ exchange: "binance", symbol: "BTCUSDT", side: "LONG", quantity: 1, price: 65000, valueUsd: 65000, timestamp: "2026-04-16T07:00:00Z" }),
    ]);
    // ETH liquidations
    mockZrange.mockResolvedValueOnce([
      JSON.stringify({ exchange: "bybit", symbol: "ETHUSDT", side: "SHORT", quantity: 20, price: 3500, valueUsd: 70000, timestamp: "2026-04-16T07:01:00Z" }),
    ]);

    const { GET } = await import("../app/api/v1/public/liquidations/feed/route");
    const request = new Request("http://localhost:3000/api/v1/public/liquidations/feed?limit=50");
    const { NextRequest } = await import("next/server");
    const response = await GET(new NextRequest(request));
    const json = await response.json();

    expect(json.data).toHaveLength(2);
    // ETH (70K) should be first (higher valueUsd)
    expect(json.data[0].symbol).toBe("ETHUSDT");
    expect(json.data[0].valueUsd).toBe(70000);
    expect(json.data[1].symbol).toBe("BTCUSDT");
  });

  it("respects limit parameter", async () => {
    mockZrange.mockResolvedValueOnce([
      JSON.stringify({ exchange: "binance", symbol: "BTCUSDT", side: "LONG", quantity: 1, price: 65000, valueUsd: 65000, timestamp: "2026-04-16T07:00:00Z" }),
      JSON.stringify({ exchange: "binance", symbol: "BTCUSDT", side: "SHORT", quantity: 0.5, price: 64000, valueUsd: 32000, timestamp: "2026-04-16T07:01:00Z" }),
    ]);
    mockZrange.mockResolvedValueOnce([]);

    const { GET } = await import("../app/api/v1/public/liquidations/feed/route");
    const request = new Request("http://localhost:3000/api/v1/public/liquidations/feed?limit=1");
    const { NextRequest } = await import("next/server");
    const response = await GET(new NextRequest(request));
    const json = await response.json();

    expect(json.data).toHaveLength(1);
    expect(json.data[0].valueUsd).toBe(65000); // Highest value
  });

  it("returns empty when no data", async () => {
    mockZrange.mockResolvedValue([]);

    const { GET } = await import("../app/api/v1/public/liquidations/feed/route");
    const request = new Request("http://localhost:3000/api/v1/public/liquidations/feed");
    const { NextRequest } = await import("next/server");
    const response = await GET(new NextRequest(request));
    const json = await response.json();

    expect(json.data).toHaveLength(0);
    expect(json.meta.count).toBe(0);
  });
});
