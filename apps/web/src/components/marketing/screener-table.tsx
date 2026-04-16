"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { EducationTooltip } from "@/components/shared/education-tooltip";

interface ScreenerPair {
  symbol: string;
  funding: { rate: number; exchange: string } | null;
  oi: { value: number; exchange: string } | null;
}

type SortKey = "symbol" | "funding" | "oi";
type SortDir = "asc" | "desc";

const PAIR_COLORS: Record<string, string> = {
  BTC: "bg-[var(--accent-amber)]",
  ETH: "bg-[var(--accent-blue)]",
  SOL: "bg-[var(--positive)]",
  BNB: "bg-[var(--exchange-binance)]",
  XRP: "bg-[var(--text-muted)]",
  DOGE: "bg-[var(--text-muted)]",
};

export function ScreenerTable({ data }: { data: ScreenerPair[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("oi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const filtered = useMemo(() => {
    let result = data.filter((p) =>
      p.symbol.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "symbol") {
        return sortDir === "asc"
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      }
      if (sortKey === "funding") {
        av = a.funding?.rate ?? 0;
        bv = b.funding?.rate ?? 0;
      }
      if (sortKey === "oi") {
        av = a.oi?.value ?? 0;
        bv = b.oi?.value ?? 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return result;
  }, [data, search, sortKey, sortDir]);

  return (
    <div>
      {/* Search + delayed badge */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search pairs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-10 pr-8 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-amber)] focus:ring-1 focus:ring-[var(--accent-amber-glow)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>
        <span className="rounded bg-[rgba(59,130,246,0.1)] px-2 py-1 text-xs text-[var(--info)]">
          Delayed 15min
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th
                onClick={() => toggleSort("symbol")}
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                Pair{sortArrow("symbol")}
              </th>
              <th
                onClick={() => toggleSort("funding")}
                className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <span className="inline-flex items-center">
                  Funding Rate{sortArrow("funding")}
                  <EducationTooltip text="The fee exchanged between longs and shorts every 8h. Positive = longs pay shorts (bullish crowding). Extreme values (>0.1%) often precede reversals." />
                </span>
              </th>
              <th
                onClick={() => toggleSort("oi")}
                className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <span className="inline-flex items-center">
                  Open Interest{sortArrow("oi")}
                  <EducationTooltip text="Total value of outstanding futures contracts. Rising OI + rising price = new money entering (trend continuation). Rising OI + falling price = aggressive shorting." />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const base = row.symbol.replace("USDT", "");
              const colorClass = PAIR_COLORS[base] || "bg-[var(--text-muted)]";
              return (
                <tr key={row.symbol} className="border-b border-[var(--border)]/40 hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-3">
                    <Link href={`/${row.symbol.toLowerCase()}`} className="flex items-center gap-2 font-medium text-[var(--text-primary)] hover:text-[var(--accent-amber)]">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-[var(--bg)] ${colorClass}`}>
                        {base[0]}
                      </span>
                      {base}/USDT
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    <span className={(row.funding?.rate ?? 0) >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                      {row.funding
                        ? `${row.funding.rate >= 0 ? "+" : ""}${(row.funding.rate * 100).toFixed(4)}%`
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-secondary)]">
                    {row.oi
                      ? row.oi.value >= 1e9
                        ? `$${(row.oi.value / 1e9).toFixed(1)}B`
                        : `$${(row.oi.value / 1e6).toFixed(0)}M`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Want real-time data across 3 exchanges?
        </p>
        <div className="mt-3 flex justify-center gap-3">
          <Link href="/signup" className="text-sm font-medium text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)]">
            Sign Up Free
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
