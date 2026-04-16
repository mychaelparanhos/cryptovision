import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Ambient amber glow */}
      <div className="pointer-events-none absolute -top-24 right-0 h-[500px] w-[500px] rounded-full bg-[var(--accent-amber)] opacity-[0.06] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <h1 className="max-w-[600px] text-4xl font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] md:text-5xl lg:text-[56px]">
          See what no single exchange shows you.
        </h1>

        <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-[var(--text-secondary)]">
          Binance, Bybit and OKX liquidations, funding rates and open interest
          — aggregated in one screen, updated every second. Stop alt-tabbing.
          Start seeing the full picture.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-[var(--accent-amber)] px-6 py-3 text-sm font-semibold text-[var(--bg)] shadow-[0_0_20px_var(--accent-amber-glow)] transition-colors hover:bg-[var(--accent-amber-hover)]"
          >
            Start Free — No Card Required
          </Link>
          <Link
            href="/screener"
            className="inline-flex items-center rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface)]"
          >
            See live demo
          </Link>
        </div>

        {/* Heatmap preview placeholder */}
        <div className="relative mt-16 overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="relative h-[280px] bg-gradient-to-br from-[var(--bg)] via-[rgba(59,130,246,0.04)] via-30% via-[rgba(245,158,11,0.08)] to-[var(--bg)] md:h-[360px]">
            {/* Grid overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.03) 30px)",
              }}
            />
            <div className="absolute inset-0 flex items-end justify-between px-6 pb-4">
              <span className="font-mono text-xs text-[var(--text-muted)]">
                BTC/USDT — Aggregated Liquidation Heatmap — 24h
              </span>
              <span className="rounded bg-[var(--accent-amber-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--accent-amber)]">
                LIVE PREVIEW
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
