import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";

export async function GET() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return NextResponse.json(
      { data: [], meta: { exchange: "consolidated", delayed: true, sources: [] } },
      { status: 200 }
    );
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const symbols = [...SUPPORTED_SYMBOLS];
  const [fundingResults, oiResults] = await Promise.all([
    Promise.all(
      symbols.map(async (s) => {
        const d = await redis.get<string>(`cv:cache:funding:${s}`);
        return d ? { symbol: s, type: "funding" as const, ...JSON.parse(d) } : null;
      })
    ),
    Promise.all(
      symbols.map(async (s) => {
        const d = await redis.get<string>(`cv:cache:oi:${s}`);
        return d ? { symbol: s, type: "oi" as const, ...JSON.parse(d) } : null;
      })
    ),
  ]);

  // Merge funding + OI data per symbol
  const merged = symbols.map((symbol) => {
    const funding = fundingResults.find((f) => f?.symbol === symbol);
    const oi = oiResults.find((o) => o?.symbol === symbol);
    return { symbol, funding: funding ?? null, oi: oi ?? null };
  });

  return NextResponse.json({
    data: merged.filter((m) => m.funding || m.oi),
    meta: {
      exchange: "consolidated",
      delayed: true,
      timestamp: new Date().toISOString(),
      sources: ["binance"],
    },
  });
}
