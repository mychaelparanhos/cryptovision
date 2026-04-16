"use client";

import { useEffect, useState, useCallback } from "react";

interface Liquidation {
  exchange: string;
  symbol: string;
  side: "LONG" | "SHORT";
  quantity: number;
  price: number;
  valueUsd: number;
  timestamp: string;
}

const EXCHANGE_COLORS: Record<string, string> = {
  binance: "#F0B90B",
  bybit: "#F7A600",
  okx: "#FFFFFF",
};

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TopLiquidationsFeed() {
  const [data, setData] = useState<Liquidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/public/liquidations/feed?limit=50");
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const displayed = expanded ? data : data.slice(0, 10);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#FAFAFA]">
              Top Liquidations
            </h2>
            <span className="text-xs text-[#71717A]">Delayed 15min</span>
          </div>
          <span className="text-xs text-[#71717A]">
            {data.length} events
          </span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-[#71717A] text-sm">
              Loading liquidations...
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2">
            <div className="text-[#71717A] text-sm">
              No recent liquidations
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {displayed.map((liq, i) => {
              const isWhale = liq.valueUsd > 100_000;
              return (
                <div
                  key={`${liq.exchange}-${liq.symbol}-${liq.timestamp}-${i}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-all duration-150 ease-out ${
                    isWhale
                      ? "bg-[#F59E0B]/5 border border-[#F59E0B]/20"
                      : "hover:bg-[#27272A]/30"
                  }`}
                >
                  {/* Left: time + symbol + exchange */}
                  <div className="flex items-center gap-3">
                    <span className="text-[#525252] font-mono w-16">
                      {formatTime(liq.timestamp)}
                    </span>
                    <span className="text-[#FAFAFA] font-medium w-16">
                      {liq.symbol.replace("USDT", "")}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          EXCHANGE_COLORS[liq.exchange] || "#71717A",
                      }}
                      title={liq.exchange}
                    />
                  </div>

                  {/* Center: side */}
                  <span
                    className={`font-medium w-12 text-center ${
                      liq.side === "LONG"
                        ? "text-[#EF4444]"
                        : "text-[#22C55E]"
                    }`}
                  >
                    {liq.side}
                  </span>

                  {/* Right: value */}
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-[#A1A1AA] w-20 text-right">
                      {liq.quantity.toFixed(4)}
                    </span>
                    <span
                      className={`w-20 text-right font-medium ${
                        isWhale ? "text-[#F59E0B]" : "text-[#FAFAFA]"
                      }`}
                    >
                      {formatUsd(liq.valueUsd)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data.length > 10 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
            >
              {expanded ? "Show top 10" : `See full feed (${data.length})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
