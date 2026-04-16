import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis
const mockZrange = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    zrange: mockZrange,
  })),
}));

describe("Liquidation Heatmap API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache so each test gets fresh import
    vi.resetModules();
  });

  it("returns liquidation data from aggregated cache", async () => {
    const mockLiqs = [
      JSON.stringify({
        exchange: "binance",
        symbol: "BTCUSDT",
        side: "LONG",
        quantity: 1.5,
        price: 65000,
        valueUsd: 97500,
        timestamp: "2026-04-16T07:00:00Z",
      }),
      JSON.stringify({
        exchange: "bybit",
        symbol: "BTCUSDT",
        side: "SHORT",
        quantity: 0.8,
        price: 64500,
        valueUsd: 51600,
        timestamp: "2026-04-16T07:01:00Z",
      }),
    ];

    mockZrange.mockResolvedValueOnce(mockLiqs);

    const { GET } = await import(
      "../app/api/v1/public/liquidations/heatmap/route"
    );

    const request = new Request(
      "http://localhost:3000/api/v1/public/liquidations/heatmap?symbol=BTCUSDT"
    );
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(request);

    const response = await GET(nextReq);
    const json = await response.json();

    expect(json.data).toHaveLength(2);
    expect(json.data[0].exchange).toBe("binance");
    expect(json.data[0].valueUsd).toBe(97500);
    expect(json.data[1].exchange).toBe("bybit");
    expect(json.meta.sources).toContain("binance");
    expect(json.meta.sources).toContain("bybit");
    expect(json.meta.symbol).toBe("BTCUSDT");
  });

  it("returns empty array when cache is empty", async () => {
    mockZrange.mockResolvedValueOnce([]);

    const { GET } = await import(
      "../app/api/v1/public/liquidations/heatmap/route"
    );

    const request = new Request(
      "http://localhost:3000/api/v1/public/liquidations/heatmap?symbol=BTCUSDT"
    );
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(request);

    const response = await GET(nextReq);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(0);
    expect(json.meta.sources).toHaveLength(0);
  });

  it("returns 400 for invalid symbol", async () => {
    const { GET } = await import(
      "../app/api/v1/public/liquidations/heatmap/route"
    );

    const request = new Request(
      "http://localhost:3000/api/v1/public/liquidations/heatmap?symbol=INVALIDCOIN"
    );
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(request);

    const response = await GET(nextReq);
    expect(response.status).toBe(400);
  });

  it("defaults to BTCUSDT when no symbol provided", async () => {
    mockZrange.mockResolvedValueOnce([]);

    const { GET } = await import(
      "../app/api/v1/public/liquidations/heatmap/route"
    );

    const request = new Request(
      "http://localhost:3000/api/v1/public/liquidations/heatmap"
    );
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest(request);

    const response = await GET(nextReq);
    const json = await response.json();

    expect(json.meta.symbol).toBe("BTCUSDT");
  });
});
