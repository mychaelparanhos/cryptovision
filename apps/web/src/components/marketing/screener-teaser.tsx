import Link from "next/link";

interface ScreenerRow {
  symbol: string;
  funding: { rate: number } | null;
  oi: { value: number } | null;
}

export async function ScreenerTeaser() {
  let data: ScreenerRow[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `https://${process.env.VERCEL_URL || "localhost:3000"}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/public/screener`, {
      next: { revalidate: 900 },
    });
    if (res.ok) {
      const json = await res.json();
      data = (json.data || []).slice(0, 3);
    }
  } catch {
    // Fallback to empty — SSR will still render the section
  }

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          The futures screener you keep rebuilding in spreadsheets.
        </h2>
        <p className="mt-3 max-w-xl text-[var(--text-secondary)]">
          Filter 200+ perpetual pairs by funding rate, OI change, liquidation
          volume and price action — across Binance, Bybit and OKX
          simultaneously.
        </p>

        {/* Mini table */}
        <div className="mt-8 overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Funding Rate
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wider md:table-cell">
                  Open Interest
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0
                ? data.map((row) => (
                    <tr
                      key={row.symbol}
                      className="border-b border-[var(--border)]/40"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {row.symbol.replace("USDT", "/USDT")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        <span
                          className={
                            (row.funding?.rate ?? 0) >= 0
                              ? "text-[var(--positive)]"
                              : "text-[var(--negative)]"
                          }
                        >
                          {row.funding
                            ? `${(row.funding.rate >= 0 ? "+" : "")}${(row.funding.rate * 100).toFixed(4)}%`
                            : "—"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-sm text-[var(--text-secondary)] md:table-cell">
                        {row.oi
                          ? `$${(row.oi.value / 1e9).toFixed(1)}B`
                          : "—"}
                      </td>
                    </tr>
                  ))
                : ["BTC/USDT", "ETH/USDT", "SOL/USDT"].map((pair) => (
                    <tr
                      key={pair}
                      className="border-b border-[var(--border)]/40"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {pair}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-[var(--text-muted)]">
                        —
                      </td>
                      <td className="hidden px-4 py-3 text-right font-mono text-sm text-[var(--text-muted)] md:table-cell">
                        —
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Link
            href="/screener"
            className="inline-flex items-center text-sm font-medium text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)] transition-colors"
          >
            Open the Screener →
          </Link>
        </div>
      </div>
    </section>
  );
}
