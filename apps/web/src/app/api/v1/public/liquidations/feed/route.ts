import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";
import { getRedis } from "@/lib/redis";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    Number(limitParam) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({
      data: [],
      meta: { delayed: true, sources: [], count: 0 },
    });
  }

  // Read aggregated liquidations from all symbols' sorted sets
  const symbols = [...SUPPORTED_SYMBOLS];
  const allLiqs: Array<{
    exchange: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    valueUsd: number;
    timestamp: string;
  }> = [];

  // Batch read from each symbol's sorted set (top by valueUsd)
  const perSymbolLimit = Math.ceil(limit / symbols.length) + 5;
  for (const symbol of symbols) {
    const key = `cv:cache:liq:agg:${symbol}:latest`;
    try {
      const raw = await redis.zrange(key, 0, perSymbolLimit - 1, {
        rev: true,
      });
      for (const item of raw) {
        const parsed =
          typeof item === "string" ? JSON.parse(item) : item;
        allLiqs.push({
          exchange: parsed.exchange,
          symbol: parsed.symbol,
          side: parsed.side,
          quantity: Number(parsed.quantity),
          price: Number(parsed.price),
          valueUsd: Number(parsed.valueUsd),
          timestamp: parsed.timestamp,
        });
      }
    } catch {
      // Skip symbol on error
    }
  }

  // Sort by valueUsd desc, take top N
  allLiqs.sort((a, b) => b.valueUsd - a.valueUsd);
  const data = allLiqs.slice(0, limit);

  const sources = [...new Set(data.map((d) => d.exchange))];

  return NextResponse.json({
    data,
    meta: {
      delayed: true,
      sources,
      count: data.length,
      timestamp: new Date().toISOString(),
    },
  });
}
