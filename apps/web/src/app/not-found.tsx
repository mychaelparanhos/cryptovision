import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";

const TOP_PAIRS = [
  { symbol: "btcusdt", name: "BTC/USDT" },
  { symbol: "ethusdt", name: "ETH/USDT" },
  { symbol: "solusdt", name: "SOL/USDT" },
  { symbol: "bnbusdt", name: "BNB/USDT" },
  { symbol: "xrpusdt", name: "XRP/USDT" },
];

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            This pair isn&apos;t tracked yet.
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Here are the most popular pairs:
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {TOP_PAIRS.map((pair) => (
              <Link
                key={pair.symbol}
                href={`/${pair.symbol}`}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-amber)] hover:text-[var(--accent-amber)] transition-colors"
              >
                {pair.name}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/screener"
              className="text-sm font-medium text-[var(--accent-amber)] hover:text-[var(--accent-amber-hover)]"
            >
              View All Pairs →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
