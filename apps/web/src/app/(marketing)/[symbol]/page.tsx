import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SUPPORTED_SYMBOLS } from "@cryptovision/shared";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/marketing/footer";

interface Props {
  params: Promise<{ symbol: string }>;
}

const SYMBOL_SET = new Set(SUPPORTED_SYMBOLS.map((s) => s.toLowerCase()));

export async function generateStaticParams() {
  return SUPPORTED_SYMBOLS.map((s) => ({ symbol: s.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const base = upper.replace("USDT", "");

  if (!SYMBOL_SET.has(symbol)) return {};

  return {
    title: `${base} Futures Analytics — Funding Rate, Open Interest | CryptoVision`,
    description: `Track ${base} perpetual futures data: funding rate, open interest, liquidations across Binance, Bybit & OKX.`,
    openGraph: {
      title: `${base}/USDT Futures Analytics | CryptoVision`,
      description: `Real-time ${base} funding rates, open interest, and liquidation data.`,
      images: [`/api/og/${symbol}`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 900;

export default async function SymbolPage({ params }: Props) {
  const { symbol } = await params;
  if (!SYMBOL_SET.has(symbol)) notFound();

  const upper = symbol.toUpperCase();
  const base = upper.replace("USDT", "");

  // Mock data (will use Redis cache when live)
  const funding = { rate: 0.0001, nextFunding: "4h 12m" };
  const oi = { value: 18.2e9, change24h: 3.2 };
  const liq = { longs: 45e6, shorts: 23e6 };

  const faqItems = [
    {
      q: `What is ${base} funding rate?`,
      a: `The ${base} funding rate is a periodic fee exchanged between long and short position holders on perpetual futures. Positive rates mean longs pay shorts. Rates are typically settled every 8 hours on Binance, Bybit, and OKX.`,
    },
    {
      q: `How to read ${base} open interest?`,
      a: `Open interest represents the total value of outstanding ${base} futures contracts. Rising OI with rising price suggests new money entering the market. Rising OI with falling price indicates aggressive short selling.`,
    },
    {
      q: `What are ${base} liquidations?`,
      a: `Liquidations occur when leveraged ${base} positions are forcibly closed because the trader's margin is insufficient. Large cascading liquidations can amplify price moves in either direction.`,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Symbol Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">
              {base} / USDT
            </h1>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                $67,234.50
              </span>
              <span className="rounded bg-[var(--positive-bg)] px-2 py-0.5 font-mono text-sm text-[var(--positive)]">
                +2.3%
              </span>
            </div>
          </div>

          {/* 3 Data Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Funding Rate
              </p>
              <p className="mt-2 font-mono text-xl font-semibold text-[var(--positive)]">
                +{(funding.rate * 100).toFixed(4)}%
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Next: {funding.nextFunding}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Open Interest
              </p>
              <p className="mt-2 font-mono text-xl font-semibold text-[var(--text-primary)]">
                ${(oi.value / 1e9).toFixed(1)}B
              </p>
              <p className="mt-1 text-xs text-[var(--positive)]">
                +{oi.change24h}% (24h)
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Liquidations 24h
              </p>
              <div className="mt-2 space-y-1">
                <p className="font-mono text-sm text-[var(--positive)]">
                  ${(liq.longs / 1e6).toFixed(0)}M longs
                </p>
                <p className="font-mono text-sm text-[var(--negative)]">
                  ${(liq.shorts / 1e6).toFixed(0)}M shorts
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Want real-time data across 3 exchanges?
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-[var(--accent-amber)] px-6 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-[var(--accent-amber-hover)]"
              >
                Sign Up Free
              </Link>
              <Link
                href="/screener"
                className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              >
                View Live Screener
              </Link>
            </div>
          </div>

          {/* FAQ with JSON-LD */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-4">
              {faqItems.map((faq, i) => (
                <details key={i} className="group rounded-lg border border-[var(--border)]">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-amber)]">
                    {faq.q}
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqItems.map((faq) => ({
                  "@type": "Question",
                  name: faq.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.a,
                  },
                })),
              }),
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
