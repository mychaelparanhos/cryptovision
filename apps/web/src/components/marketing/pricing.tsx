"use client";

import { useState } from "react";
import Link from "next/link";

const TIERS = [
  {
    name: "Market Pulse",
    tier: "Free",
    monthly: 0,
    annual: 0,
    cta: "Get Started Free",
    ctaStyle: "secondary" as const,
    features: [
      "Aggregated liquidation heatmap (15-min delay)",
      "Funding rates across 3 exchanges",
      "Open interest overview",
      "Liquidation feed (consolidated)",
      "200+ perpetual pairs",
      "Community access",
    ],
  },
  {
    name: "Pulse Pro",
    tier: "Lite",
    monthly: 14,
    annual: 140,
    cta: "Start with Pulse Pro",
    ctaStyle: "secondary" as const,
    features: [
      "Everything in Market Pulse",
      "Real-time data (no delay)",
      "Per-exchange breakdown views",
      "3 Telegram alert rules",
      "3 days historical data",
      "Priority data refresh",
    ],
  },
  {
    name: "Signal Feed",
    tier: "Starter",
    monthly: 29,
    annual: 290,
    cta: "Start with Signal Feed",
    ctaStyle: "secondary" as const,
    features: [
      "Everything in Pulse Pro",
      "Rich Alerts with mini-charts and context",
      "Unlimited custom alert rules",
      "API access (1,000 requests/day)",
      "7 days historical data",
      "Webhook notifications",
    ],
  },
  {
    name: "Deep Analytics",
    tier: "Pro",
    monthly: 99,
    annual: 990,
    popular: true,
    cta: "Start with Deep Analytics",
    ctaStyle: "primary" as const,
    features: [
      "Everything in Signal Feed",
      "Cross-exchange comparison dashboards",
      "OI divergence detection",
      "Custom webhook integrations",
      "90 days historical data",
      "API access (50,000 requests/day)",
      "Confluence Score & AI Brief (coming soon)",
    ],
  },
  {
    name: "Quant Engine",
    tier: "Enterprise",
    monthly: 299,
    annual: null,
    cta: "Contact Us",
    ctaStyle: "secondary" as const,
    features: [
      "Everything in Deep Analytics",
      "Full historical data export (CSV/JSON)",
      "Dedicated WebSocket streams",
      "Priority support (< 4hr response)",
      "Custom data retention",
      "SLA guarantee",
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            Pick your edge.
          </h2>
          <p className="mt-3 text-[var(--text-secondary)]">
            Every plan includes aggregated data from Binance, Bybit and OKX. No
            hidden fees. Cancel anytime.
          </p>

          {/* Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[var(--surface)] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !annual
                  ? "bg-[var(--accent-amber)] text-[var(--bg)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                annual
                  ? "bg-[var(--accent-amber)] text-[var(--bg)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-75">(2 months free)</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TIERS.map((tier) => {
            const price = annual && tier.annual !== null
              ? Math.round(tier.annual / 12)
              : tier.monthly;
            const isPopular = tier.popular;

            return (
              <div
                key={tier.tier}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  isPopular
                    ? "border-[var(--accent-amber)] bg-[var(--accent-amber-subtle)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-amber)] px-3 py-0.5 text-xs font-semibold text-[var(--bg)]">
                    Most Popular
                  </span>
                )}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    {tier.tier}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    {tier.name}
                  </h3>
                </div>

                <div className="mt-4">
                  {tier.monthly === 0 ? (
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      Free
                    </span>
                  ) : tier.annual === null ? (
                    <span className="text-lg font-medium text-[var(--text-secondary)]">
                      Custom
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">
                        ${price}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">
                        /mo
                      </span>
                    </div>
                  )}
                  {annual && tier.annual !== null && tier.monthly > 0 && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      ${tier.annual}/year
                    </p>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <span className="mt-0.5 text-[var(--positive)]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.tier === "Enterprise" ? "/contact" : "/signup"}
                  className={`mt-6 flex min-h-[42px] items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-colors ${
                    tier.ctaStyle === "primary"
                      ? "bg-[var(--accent-amber)] text-[var(--bg)] hover:bg-[var(--accent-amber-hover)]"
                      : "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
