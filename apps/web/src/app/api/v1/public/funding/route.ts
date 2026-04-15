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

  const symbols = SUPPORTED_SYMBOLS.slice(0, 20);
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const data = await redis.get<string>(`cv:cache:funding:${symbol}`);
      return data ? JSON.parse(data) : null;
    })
  );

  return NextResponse.json({
    data: results.filter(Boolean),
    meta: {
      exchange: "consolidated",
      delayed: true,
      timestamp: new Date().toISOString(),
      sources: ["binance"],
    },
  });
}
