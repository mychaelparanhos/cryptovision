export function Features() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          Data that answers WHY, not just WHAT.
        </h2>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Large feature — Heatmap */}
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="relative h-[320px] bg-gradient-to-br from-[var(--bg)] via-[rgba(245,158,11,0.06)] to-[var(--bg)] lg:h-[400px]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.02) 30px), repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.02) 20px)",
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--bg)] to-transparent p-6">
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  BTC/USDT — $127M in long liquidations clustered between
                  $64,200–$64,800 across 3 exchanges.
                </p>
              </div>
            </div>
            <div className="border-t border-[var(--border)] p-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                Aggregated Liquidation Heatmap
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                Most heatmaps show you one exchange. Ours stacks Binance, Bybit
                and OKX into a single view so you see where the real liquidity
                clusters sit — not just where one venue&apos;s traders are
                exposed. Watch $50M+ liquidation walls form in real time and know
                which side of the trade is overweight before the cascade starts.
              </p>
            </div>
          </div>

          {/* Right column — 3 stacked features */}
          <div className="flex flex-col gap-6">
            {/* Funding Arb */}
            <div className="rounded-xl border border-[var(--border)] p-6">
              <div className="mb-4 overflow-hidden rounded-lg bg-[var(--surface)] p-4">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Binance</span>
                    <span className="text-[var(--positive)]">+0.0300%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Bybit</span>
                    <span className="text-[var(--negative)]">-0.0100%</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <span className="text-[var(--text-muted)]">Spread</span>
                    <span className="text-[var(--accent-amber)]">4 bps</span>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Funding Arbitrage Scanner
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Spot funding rate divergences across exchanges before they
                converge. When Binance charges 0.03% and Bybit pays -0.01%, the
                trade is sitting there — we just make sure you see it.
              </p>
            </div>

            {/* Rich Alerts */}
            <div className="rounded-xl border border-[var(--border)] p-6">
              <div className="mb-4 overflow-hidden rounded-lg bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-16 rounded bg-gradient-to-r from-[var(--positive)]/20 to-[var(--negative)]/20" />
                  <div className="text-xs">
                    <p className="font-medium text-[var(--text-primary)]">
                      BTC Funding &gt; 0.05%
                    </p>
                    <p className="text-[var(--text-muted)]">
                      via Telegram · 2min ago
                    </p>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Rich Alerts
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Not just &quot;BTC hit $65K.&quot; Each alert arrives with a
                mini-chart, OI delta, funding rate and liquidation context —
                everything you need to decide in the 30 seconds before you open
                a position.
              </p>
            </div>

            {/* Confluence Score */}
            <div className="rounded-xl border border-[var(--border)] p-6">
              <div className="mb-4 overflow-hidden rounded-lg bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">
                    Confluence
                  </span>
                  <span className="font-mono text-2xl font-semibold text-[var(--accent-amber)]">
                    73
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-amber)]"
                    style={{ width: "73%" }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-[var(--accent-amber)]">
                  Elevated
                </p>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Confluence Score
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                One number that tells you how many signals agree. OI rising,
                funding negative, liquidations clustering — when 4 out of 5
                indicators align, the score tells you before you finish checking
                manually.{" "}
                <span className="text-[var(--text-muted)]">Coming soon.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
