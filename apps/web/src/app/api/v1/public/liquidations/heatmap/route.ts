import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const DEFAULT_SYMBOL = "BTCUSDT";
const VALID_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
];

export async function GET(request: NextRequest) {
  const symbol =
    request.nextUrl.searchParams.get("symbol") || DEFAULT_SYMBOL;

  if (!VALID_SYMBOLS.includes(symbol)) {
    return NextResponse.json(
      { error: "Invalid symbol", valid: VALID_SYMBOLS },
      { status: 400 }
    );
  }

  const redis = getRedis();

  if (!redis) {
    return NextResponse.json({
      data: [],
      meta: {
        symbol,
        exchange: "aggregated",
        delayed: true,
        sources: [],
      },
    });
  }

  try {
    // Read aggregated liquidations sorted set (sorted by valueUsd desc)
    const key = `cv:cache:liq:agg:${symbol}:latest`;
    const raw = await redis.zrange(key, 0, -1, { rev: true });

    const data = raw.map((item: string | Record<string, unknown>) => {
      const parsed =
        typeof item === "string" ? JSON.parse(item) : item;
      return {
        exchange: parsed.exchange,
        symbol: parsed.symbol,
        side: parsed.side,
        quantity: Number(parsed.quantity),
        price: Number(parsed.price),
        valueUsd: Number(parsed.valueUsd),
        timestamp: parsed.timestamp,
      };
    });

    // Collect sources
    const sources = [...new Set(data.map((d: { exchange: string }) => d.exchange))];

    return NextResponse.json({
      data,
      meta: {
        symbol,
        exchange: "aggregated",
        delayed: true,
        count: data.length,
        sources,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({
      data: [],
      meta: {
        symbol,
        exchange: "aggregated",
        delayed: true,
        sources: [],
        error: "cache_read_failed",
      },
    });
  }
}
