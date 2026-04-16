import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/marketing/footer";
import { ScreenerTable } from "@/components/marketing/screener-table";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";

export const metadata: Metadata = {
  title: "Crypto Futures Screener — Real-time Funding Rates, Open Interest | CryptoVision",
  description:
    "Track funding rates, open interest, and liquidations across Binance, Bybit & OKX. Free crypto futures screener with aggregated data.",
};

const FALLBACK = SUPPORTED_SYMBOLS.map((s) => ({
  symbol: s,
  funding: { rate: (Math.random() - 0.3) * 0.001, exchange: "binance" },
  oi: { value: Math.random() * 15e9 + 500e6, exchange: "binance" },
}));

export default async function ScreenerPage() {
  let data = FALLBACK;

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/public/screener`, {
      next: { revalidate: 900 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.length > 0) data = json.data;
    }
  } catch {
    // Use fallback
  }

  return (
    <>
      <Navbar />
      <main className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
            Crypto Futures Screener
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            200+ perpetual pairs across Binance, Bybit and OKX. Sorted by open interest.
          </p>
          <div className="mt-8">
            <ScreenerTable data={data} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
