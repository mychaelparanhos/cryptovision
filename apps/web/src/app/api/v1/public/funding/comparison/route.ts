import { NextResponse } from "next/server";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";
import { getRedis } from "@/lib/redis";

const EXCHANGES = ["binance", "bybit", "okx"] as const;
const DIVERGENT_THRESHOLD = 0.0001; // 0.01%

interface ExchangeFunding {
  rate: number | null;
  predictedRate: number | null;
  nextFundingTime: string | null;
}

interface ComparisonRow {
  symbol: string;
  exchanges: Record<string, ExchangeFunding>;
  spread: number;
  signal: "DIVERGENT" | null;
}

export async function GET() {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json({
      data: [],
      meta: { delayed: true, sources: [], timestamp: new Date().toISOString() },
    });
  }

  const symbols = [...SUPPORTED_SYMBOLS];

  // Build all keys: 3 exchanges x 20 symbols = 60 keys
  const keys: string[] = [];
  for (const exchange of EXCHANGES) {
    for (const symbol of symbols) {
      keys.push(`cv:cache:funding:${exchange}:${symbol}`);
    }
  }

  // Single MGET call for all 60 keys
  const results = await redis.mget<(string | null)[]>(...keys);

  const activeSources = new Set<string>();
  const rows: ComparisonRow[] = [];

  for (let si = 0; si < symbols.length; si++) {
    const symbol = symbols[si];
    const exchangeData: Record<string, ExchangeFunding> = {};
    const rates: number[] = [];

    for (let ei = 0; ei < EXCHANGES.length; ei++) {
      const raw = results[ei * symbols.length + si];
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        const rate = Number(parsed.rate);
        exchangeData[EXCHANGES[ei]] = {
          rate,
          predictedRate: parsed.predictedRate ? Number(parsed.predictedRate) : null,
          nextFundingTime: parsed.nextFundingTime || null,
        };
        rates.push(rate);
        activeSources.add(EXCHANGES[ei]);
      } else {
        exchangeData[EXCHANGES[ei]] = {
          rate: null,
          predictedRate: null,
          nextFundingTime: null,
        };
      }
    }

    const spread =
      rates.length >= 2
        ? Math.max(...rates) - Math.min(...rates)
        : 0;

    rows.push({
      symbol,
      exchanges: exchangeData,
      spread,
      signal: spread > DIVERGENT_THRESHOLD ? "DIVERGENT" : null,
    });
  }

  // Sort by spread desc by default
  rows.sort((a, b) => b.spread - a.spread);

  return NextResponse.json({
    data: rows,
    meta: {
      delayed: true,
      sources: [...activeSources],
      threshold: DIVERGENT_THRESHOLD,
      timestamp: new Date().toISOString(),
    },
  });
}
