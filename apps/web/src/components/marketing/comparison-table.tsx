const ROWS = [
  {
    feature: "Multi-exchange aggregation",
    cv: "Binance + Bybit + OKX unified",
    coinglass: "Per-exchange only",
    buildix: "Hyperliquid-focused",
    cryptoquant: "On-chain focus",
  },
  {
    feature: "Aggregated liquidation heatmap",
    cv: "Cross-exchange, real-time",
    coinglass: "Single-exchange",
    buildix: "Not available",
    cryptoquant: "Not available",
  },
  {
    feature: "Funding arbitrage scanner",
    cv: "Built-in, cross-exchange",
    coinglass: "Manual comparison",
    buildix: "Not available",
    cryptoquant: "Not available",
  },
  {
    feature: "Alert context",
    cv: "Mini-chart + OI + funding + liq",
    coinglass: "Price alerts only",
    buildix: "Basic alerts",
    cryptoquant: "On-chain alerts",
  },
  {
    feature: "API access",
    cv: "From $29/mo",
    coinglass: "Premium only",
    buildix: "From $29/mo",
    cryptoquant: "From $29/mo",
  },
  {
    feature: "Free tier",
    cv: "Full heatmap + funding + OI",
    coinglass: "Limited",
    buildix: "No free tier",
    cryptoquant: "Limited",
  },
];

export function ComparisonTable() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          How CryptoVision stacks up.
        </h2>

        <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Feature
                </th>
                <th className="border-l border-[var(--accent-amber)]/20 bg-[var(--accent-amber-subtle)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
                  CryptoVision
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Coinglass
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] md:table-cell">
                  Buildix
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] lg:table-cell">
                  CryptoQuant
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-[var(--border)]/40"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    {row.feature}
                  </td>
                  <td className="border-l border-[var(--accent-amber)]/20 bg-[var(--accent-amber-subtle)] px-4 py-3 text-[var(--text-primary)]">
                    {row.cv}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {row.coinglass}
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--text-muted)] md:table-cell">
                    {row.buildix}
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--text-muted)] lg:table-cell">
                    {row.cryptoquant}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
