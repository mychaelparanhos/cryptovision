import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Implement Redis cache read for last 24h aggregated liquidations
  return NextResponse.json({
    data: [],
    meta: {
      exchange: "consolidated",
      delayed: true,
      timestamp: new Date().toISOString(),
      sources: ["binance"],
    },
  });
}
