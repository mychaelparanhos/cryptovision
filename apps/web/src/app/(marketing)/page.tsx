export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          See what no single exchange shows you.
        </h1>
        <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
          Aggregated futures data from Binance, Bybit &amp; OKX. Funding rates,
          liquidations, open interest. One real-time dashboard.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button className="bg-accent-amber text-background px-6 py-3 rounded-lg font-semibold hover:bg-accent-amber-hover transition-colors">
            Start Free
          </button>
          <button className="border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:border-border-hover transition-colors">
            Live Screener →
          </button>
        </div>
      </div>
    </main>
  );
}
