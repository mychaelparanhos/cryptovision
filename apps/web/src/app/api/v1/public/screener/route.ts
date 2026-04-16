import { NextResponse } from "next/server";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json(
      {
        data: [],
        meta: { exchange: "aggregated", delayed: true, sources: [] },
      },
      { status: 200 }
    );
  }

  const symbols = [...SUPPORTED_SYMBOLS];

  // Batch read aggregated keys using MGET (1 call instead of N)
  const fundingKeys = symbols.map((s) => `cv:cache:funding:agg:${s}`);
  const oiKeys = symbols.map((s) => `cv:cache:oi:agg:${s}`);

  const [fundingResults, oiResults] = await Promise.all([
    redis.mget<(string | null)[]>(...fundingKeys),
    redis.mget<(string | null)[]>(...oiKeys),
  ]);

  // Collect all exchange sources that contributed data
  const allSources = new Set<string>();

  const merged = symbols.map((symbol, i) => {
    const rawFunding = fundingResults[i];
    const rawOI = oiResults[i];

    const funding = rawFunding
      ? typeof rawFunding === "string"
        ? JSON.parse(rawFunding)
        : rawFunding
      : null;
    const oi = rawOI
      ? typeof rawOI === "string"
        ? JSON.parse(rawOI)
        : rawOI
      : null;

    if (funding?.sources) {
      for (const src of funding.sources) allSources.add(src);
    }
    if (oi?.sources) {
      for (const src of oi.sources) allSources.add(src);
    }

    return { symbol, funding, oi };
  });

  return NextResponse.json({
    data: merged.filter((m) => m.funding || m.oi),
    meta: {
      exchange: "aggregated",
      delayed: true,
      timestamp: new Date().toISOString(),
      sources: [...allSources],
    },
  });
}
