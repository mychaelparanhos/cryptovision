import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendWeeklyDigest,
  type WeeklyHighlight,
} from "@/lib/email/weekly-digest";

/**
 * GET /api/cron/weekly-digest
 *
 * Protected by CRON_SECRET. Called weekly by Vercel Cron or Railway cron.
 * Sends a weekly market digest email to all active users.
 */
export async function GET(request: NextRequest) {
  // ─── Auth Check ────────────────────────────────────────

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ─── Fetch Highlights ─────────────────────────────────

  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const highlights: WeeklyHighlight[] = [];

  // Top 2 biggest liquidations by value
  const { data: topLiqs } = await supabase
    .from("liquidations")
    .select("symbol, exchange, value_usd, side, timestamp")
    .gte("timestamp", sevenDaysAgo)
    .order("value_usd", { ascending: false })
    .limit(2);

  if (topLiqs) {
    for (const liq of topLiqs) {
      const value = Number(liq.value_usd);
      const formatted =
        value >= 1_000_000
          ? `$${(value / 1_000_000).toFixed(2)}M`
          : `$${(value / 1_000).toFixed(1)}K`;

      highlights.push({
        type: "liquidation",
        symbol: liq.symbol,
        exchange: liq.exchange,
        value,
        description: `${liq.side} liquidation worth ${formatted}`,
        timestamp: liq.timestamp,
      });
    }
  }

  // Top 2 extreme funding rates
  const { data: extremeFunding } = await supabase
    .from("funding_rates")
    .select("symbol, exchange, rate, timestamp")
    .gte("timestamp", sevenDaysAgo)
    .order("rate", { ascending: false })
    .limit(1);

  const { data: negativeFunding } = await supabase
    .from("funding_rates")
    .select("symbol, exchange, rate, timestamp")
    .gte("timestamp", sevenDaysAgo)
    .order("rate", { ascending: true })
    .limit(1);

  const fundingItems = [
    ...(extremeFunding || []),
    ...(negativeFunding || []),
  ];

  for (const f of fundingItems) {
    const rate = Number(f.rate);
    highlights.push({
      type: "funding",
      symbol: f.symbol,
      exchange: f.exchange,
      value: rate,
      description: `Funding rate hit ${(rate * 100).toFixed(4)}%`,
      timestamp: f.timestamp,
    });
  }

  // Top 1 OI change (most recent high-value snapshot)
  const { data: topOI } = await supabase
    .from("open_interest")
    .select("symbol, exchange, value, timestamp")
    .gte("timestamp", sevenDaysAgo)
    .order("value", { ascending: false })
    .limit(1);

  if (topOI?.[0]) {
    const oi = topOI[0];
    highlights.push({
      type: "oi_change",
      symbol: oi.symbol,
      exchange: oi.exchange,
      value: Number(oi.value),
      description: `Peak OI reached ${Number(oi.value).toLocaleString()} contracts`,
      timestamp: oi.timestamp,
    });
  }

  // ─── Fetch Users & Send ───────────────────────────────

  const { data: users } = await supabase
    .from("users")
    .select("email")
    .not("email", "is", null);

  let sent = 0;
  let failed = 0;

  if (users) {
    for (const user of users) {
      if (!user.email) continue;
      const ok = await sendWeeklyDigest(user.email, highlights.slice(0, 5));
      if (ok) sent++;
      else failed++;
    }
  }

  return NextResponse.json({
    success: true,
    highlights: highlights.length,
    sent,
    failed,
    timestamp: new Date().toISOString(),
  });
}
