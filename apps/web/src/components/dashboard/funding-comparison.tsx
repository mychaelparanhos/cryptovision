"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

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

type SortKey = "symbol" | "spread" | "binance" | "bybit" | "okx";
type SortDir = "asc" | "desc";

const EXCHANGE_COLORS: Record<string, string> = {
  binance: "#F0B90B",
  bybit: "#F7A600",
  okx: "#FFFFFF",
};

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(4)}%`;
}

function rateColor(rate: number | null): string {
  if (rate === null) return "#71717A";
  if (rate > 0) return "#22C55E";
  if (rate < 0) return "#EF4444";
  return "#A1A1AA";
}

function getExchangeRate(row: ComparisonRow, exchange: string): number | null {
  return row.exchanges[exchange]?.rate ?? null;
}

export function FundingComparison() {
  const [data, setData] = useState<ComparisonRow[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("spread");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/public/funding/comparison");
      const json = await res.json();
      setData(json.data || []);
      setSources(json.meta?.sources || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const filtered = data.filter((r) =>
      r.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      switch (sortKey) {
        case "symbol":
          av = a.symbol;
          bv = b.symbol;
          return sortDir === "asc"
            ? av.localeCompare(bv as string)
            : (bv as string).localeCompare(av as string);
        case "spread":
          av = a.spread;
          bv = b.spread;
          break;
        case "binance":
        case "bybit":
        case "okx":
          av = getExchangeRate(a, sortKey) ?? -Infinity;
          bv = getExchangeRate(b, sortKey) ?? -Infinity;
          break;
        default:
          return 0;
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [data, search, sortKey, sortDir]);

  const displayed = expanded ? sorted : sorted.slice(0, 10);

  const SortArrow = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      <span className="ml-1 text-[#F59E0B]">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    ) : null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#FAFAFA]">
              Funding Rate Comparison
            </h2>
            <div className="relative">
              <button
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
                className="text-[#71717A] hover:text-[#A1A1AA] text-xs border border-[#27272A] rounded-full w-4 h-4 flex items-center justify-center"
              >
                ?
              </button>
              {tooltipVisible && (
                <div className="absolute left-6 top-0 z-20 w-64 bg-[#09090B] border border-[#27272A] rounded-lg p-3 text-xs text-[#A1A1AA] shadow-lg">
                  <p className="font-medium text-[#FAFAFA] mb-1">
                    What is Funding Rate?
                  </p>
                  <p>
                    Funding rates are periodic payments between long and short
                    traders. Positive = longs pay shorts (bullish crowding).
                    Negative = shorts pay longs (bearish crowding). Large
                    divergences between exchanges can signal arbitrage
                    opportunities or incoming squeezes.
                  </p>
                </div>
              )}
            </div>
            {sources.map((src) => (
              <span
                key={src}
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: EXCHANGE_COLORS[src] || "#71717A" }}
                title={src}
              />
            ))}
            <span className="text-xs text-[#71717A]">Delayed 15min</span>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#FAFAFA] placeholder-[#525252] w-40 focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-pulse text-[#71717A] text-sm">
              Loading funding rates...
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center gap-2">
            <div className="text-[#71717A] text-sm">
              No funding rate data available
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272A] text-[#71717A] text-xs">
                  <th
                    className="text-left py-2 px-3 cursor-pointer hover:text-[#A1A1AA]"
                    onClick={() => handleSort("symbol")}
                  >
                    Symbol
                    <SortArrow col="symbol" />
                  </th>
                  {(["binance", "bybit", "okx"] as const).map((ex) => (
                    <th
                      key={ex}
                      className="text-right py-2 px-3 cursor-pointer hover:text-[#A1A1AA]"
                      onClick={() => handleSort(ex)}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{
                          backgroundColor: EXCHANGE_COLORS[ex],
                        }}
                      />
                      {ex.charAt(0).toUpperCase() + ex.slice(1)}
                      <SortArrow col={ex} />
                    </th>
                  ))}
                  <th
                    className="text-right py-2 px-3 cursor-pointer hover:text-[#A1A1AA]"
                    onClick={() => handleSort("spread")}
                  >
                    Spread
                    <SortArrow col="spread" />
                  </th>
                  <th className="text-center py-2 px-3">Signal</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {displayed.map((row) => (
                  <tr
                    key={row.symbol}
                    className="border-b border-[#27272A]/50 hover:bg-[#27272A]/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-[#FAFAFA] font-sans font-medium">
                      {row.symbol.replace("USDT", "")}
                    </td>
                    {(["binance", "bybit", "okx"] as const).map((ex) => {
                      const rate = getExchangeRate(row, ex);
                      return (
                        <td
                          key={ex}
                          className="py-2.5 px-3 text-right tabular-nums"
                          style={{ color: rateColor(rate) }}
                        >
                          {formatRate(rate)}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right text-[#FAFAFA] tabular-nums">
                      {formatRate(row.spread)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.signal === "DIVERGENT" && (
                        <span className="text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                          DIVERGENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expand / collapse */}
        {sorted.length > 10 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
            >
              {expanded
                ? "Show top 10"
                : `See all ${sorted.length} pairs`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
