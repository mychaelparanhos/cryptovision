export function SocialProof() {
  return (
    <section className="border-y border-[var(--border)] px-6 py-5">
      <p className="mx-auto max-w-7xl text-center text-sm text-[var(--text-muted)]">
        <span className="mr-3 inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--exchange-binance)]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--exchange-bybit)]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--exchange-okx)]" />
        </span>
        Tracking $2B+ in daily liquidations across 3 exchanges and 200+
        futures pairs.
      </p>
    </section>
  );
}
