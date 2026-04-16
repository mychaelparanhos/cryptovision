"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TIER_LIMITS, TIER_ORDER } from "@cryptovision/shared";
import type { Plan } from "@cryptovision/shared";
import { STRIPE_PRICES } from "@/lib/stripe/prices";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/marketing/footer";

/* ---------- tier display config ---------- */

interface TierDisplay {
  plan: Plan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number | null;
  cta: string;
  priceIdMonthly: string;
  priceIdAnnual: string;
  features: string[];
  popular?: boolean;
}

const TIER_DISPLAY: TierDisplay[] = [
  {
    plan: "free",
    name: "Market Pulse",
    tagline: "Free",
    monthlyPrice: 0,
    annualPrice: null,
    cta: "Get Started",
    priceIdMonthly: "",
    priceIdAnnual: "",
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
    plan: "lite",
    name: "Pulse Pro",
    tagline: "Lite",
    monthlyPrice: 14,
    annualPrice: 140,
    cta: "Subscribe",
    priceIdMonthly: STRIPE_PRICES.lite_monthly || "price_lite_monthly_placeholder",
    priceIdAnnual: STRIPE_PRICES.lite_annual || "price_lite_annual_placeholder",
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
    plan: "starter",
    name: "Signal Feed",
    tagline: "Starter",
    monthlyPrice: 29,
    annualPrice: 290,
    cta: "Subscribe",
    priceIdMonthly: STRIPE_PRICES.starter_monthly || "price_starter_monthly_placeholder",
    priceIdAnnual: STRIPE_PRICES.starter_annual || "price_starter_annual_placeholder",
    popular: true,
    features: [
      "Everything in Pulse Pro",
      "Rich Alerts with mini-charts and context",
      "Unlimited custom alert rules",
      "API access (1,000 req/day)",
      "7 days historical data",
      "Webhook notifications",
    ],
  },
  {
    plan: "pro",
    name: "Deep Analytics",
    tagline: "Pro",
    monthlyPrice: 99,
    annualPrice: 990,
    cta: "Subscribe",
    priceIdMonthly: STRIPE_PRICES.pro_monthly || "price_pro_monthly_placeholder",
    priceIdAnnual: STRIPE_PRICES.pro_annual || "price_pro_annual_placeholder",
    features: [
      "Everything in Signal Feed",
      "Cross-exchange comparison dashboards",
      "OI divergence detection",
      "Custom webhook integrations",
      "90 days historical data",
      "API access (50,000 req/day)",
      "Confluence Score & AI Brief (coming soon)",
    ],
  },
  {
    plan: "enterprise",
    name: "Quant Engine",
    tagline: "Enterprise",
    monthlyPrice: 299,
    annualPrice: null,
    cta: "Contact Us",
    priceIdMonthly: STRIPE_PRICES.enterprise_monthly || "price_enterprise_monthly_placeholder",
    priceIdAnnual: "",
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

/* ---------- comparison features ---------- */

interface ComparisonFeature {
  label: string;
  values: Record<Plan, string>;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    label: "API Requests / Day",
    values: {
      free: TIER_LIMITS.free.apiReqPerDay.toString(),
      lite: TIER_LIMITS.lite.apiReqPerDay.toString(),
      starter: TIER_LIMITS.starter.apiReqPerDay.toLocaleString(),
      pro: TIER_LIMITS.pro.apiReqPerDay.toLocaleString(),
      enterprise: "Unlimited",
    },
  },
  {
    label: "Real-time WS Symbols",
    values: {
      free: "--",
      lite: TIER_LIMITS.lite.wsSymbols.toString(),
      starter: TIER_LIMITS.starter.wsSymbols.toString(),
      pro: "Unlimited",
      enterprise: "Unlimited",
    },
  },
  {
    label: "Historical Data",
    values: {
      free: "--",
      lite: `${TIER_LIMITS.lite.historicalDays} days`,
      starter: `${TIER_LIMITS.starter.historicalDays} days`,
      pro: `${TIER_LIMITS.pro.historicalDays} days`,
      enterprise: "Unlimited",
    },
  },
  {
    label: "Custom Alerts",
    values: {
      free: "--",
      lite: `${TIER_LIMITS.lite.maxAlerts}`,
      starter: "Unlimited",
      pro: "Unlimited",
      enterprise: "Unlimited",
    },
  },
  {
    label: "Real-time Data",
    values: {
      free: "--",
      lite: "Yes",
      starter: "Yes",
      pro: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "Per-exchange Breakdown",
    values: {
      free: "--",
      lite: "Yes",
      starter: "Yes",
      pro: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "API Access",
    values: {
      free: "--",
      lite: "--",
      starter: "Yes",
      pro: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "Cross-exchange Comparison",
    values: {
      free: "--",
      lite: "--",
      starter: "--",
      pro: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "Custom Webhooks",
    values: {
      free: "--",
      lite: "--",
      starter: "--",
      pro: "Yes",
      enterprise: "Yes",
    },
  },
  {
    label: "Data Export (CSV/JSON)",
    values: {
      free: "--",
      lite: "--",
      starter: "--",
      pro: "--",
      enterprise: "Yes",
    },
  },
  {
    label: "Dedicated WS Channel",
    values: {
      free: "--",
      lite: "--",
      starter: "--",
      pro: "--",
      enterprise: "Yes",
    },
  },
  {
    label: "Priority Support",
    values: {
      free: "--",
      lite: "--",
      starter: "--",
      pro: "--",
      enterprise: "< 4hr",
    },
  },
];

/* ---------- component ---------- */

export default function PricingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email ?? "" });
    });
  }, []);

  async function handleSubscribe(tier: TierDisplay) {
    if (tier.plan === "free") {
      router.push("/signup");
      return;
    }

    if (tier.plan === "enterprise") {
      window.location.href = "mailto:enterprise@cryptovision.app?subject=CryptoVision Enterprise Inquiry";
      return;
    }

    if (!user) {
      router.push(`/signup?redirect=/pricing&plan=${tier.plan}`);
      return;
    }

    const priceId = annual && tier.priceIdAnnual
      ? tier.priceIdAnnual
      : tier.priceIdMonthly;

    setLoadingCheckout(tier.plan);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoadingCheckout(null);
    }
  }

  function getAnnualSavingsPercent(monthly: number, annual: number): number {
    const yearlyCost = monthly * 12;
    return Math.round(((yearlyCost - annual) / yearlyCost) * 100);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#09090B]">
        {/* Header */}
        <section className="px-6 pt-20 pb-12">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="text-3xl font-bold text-[#FAFAFA] md:text-4xl">
              Pick your edge.
            </h1>
            <p className="mt-4 text-lg text-[#A1A1AA] max-w-2xl mx-auto">
              Every plan includes aggregated data from Binance, Bybit and OKX.
              No hidden fees. Cancel anytime.
            </p>

            {/* Monthly/Annual Toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-lg bg-[#18181B] p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
                  !annual
                    ? "bg-[#F59E0B] text-[#09090B]"
                    : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
                  annual
                    ? "bg-[#F59E0B] text-[#09090B]"
                    : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                Annual
                <span className="ml-1.5 text-xs opacity-75">(2 months free)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tier Cards */}
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {TIER_DISPLAY.map((tier) => {
                const isPopular = tier.popular === true;
                const displayPrice =
                  annual && tier.annualPrice !== null
                    ? Math.round(tier.annualPrice / 12)
                    : tier.monthlyPrice;

                return (
                  <div
                    key={tier.plan}
                    className={`relative flex flex-col rounded-xl border p-6 transition-shadow ${
                      isPopular
                        ? "border-[#F59E0B] bg-[#18181B] shadow-[0_0_24px_rgba(245,158,11,0.12)]"
                        : "border-[#27272A] bg-[#18181B]"
                    }`}
                  >
                    {/* Most Popular Badge */}
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F59E0B] px-3 py-0.5 text-xs font-semibold text-[#09090B]">
                        Most Popular
                      </span>
                    )}

                    {/* Tier Label + Name */}
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
                        {tier.tagline}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-[#FAFAFA]">
                        {tier.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="mt-4">
                      {tier.monthlyPrice === 0 ? (
                        <span className="text-4xl font-bold text-[#FAFAFA]">
                          Free
                        </span>
                      ) : tier.annualPrice === null ? (
                        <span className="text-lg font-medium text-[#A1A1AA]">
                          Custom
                        </span>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-[#FAFAFA]">
                              ${displayPrice}
                            </span>
                            <span className="text-sm text-[#71717A]">/mo</span>
                          </div>
                          {annual && tier.annualPrice !== null && (
                            <p className="mt-1 text-xs text-[#71717A]">
                              ${tier.annualPrice}/yr — Save{" "}
                              {getAnnualSavingsPercent(tier.monthlyPrice, tier.annualPrice)}%
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-[#A1A1AA]"
                        >
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22C55E]"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M13.5 4.5L6.5 11.5L2.5 7.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={loadingCheckout === tier.plan}
                      className={`mt-6 flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        tier.plan === "free"
                          ? "border border-[#27272A] text-[#FAFAFA] hover:bg-[#27272A]"
                          : isPopular || tier.monthlyPrice > 0
                          ? "bg-[#F59E0B] text-[#09090B] hover:bg-[#D97706]"
                          : "border border-[#27272A] text-[#FAFAFA] hover:bg-[#27272A]"
                      }`}
                    >
                      {loadingCheckout === tier.plan ? (
                        <svg
                          className="h-5 w-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="opacity-25"
                          />
                          <path
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            fill="currentColor"
                            className="opacity-75"
                          />
                        </svg>
                      ) : (
                        tier.cta
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <button
              onClick={() => setComparisonOpen(!comparisonOpen)}
              className="mx-auto flex items-center gap-2 text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <span>Compare all features</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  comparisonOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {comparisonOpen && (
              <div className="mt-8 overflow-x-auto rounded-xl border border-[#27272A]">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[#27272A] bg-[#18181B]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#71717A]">
                        Feature
                      </th>
                      {TIER_ORDER.map((plan) => (
                        <th
                          key={plan}
                          className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                            plan === "starter"
                              ? "text-[#F59E0B]"
                              : "text-[#71717A]"
                          }`}
                        >
                          {plan === "free"
                            ? "Free"
                            : plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((feature, idx) => (
                      <tr
                        key={feature.label}
                        className={`border-b border-[#27272A] ${
                          idx % 2 === 0 ? "bg-[#09090B]" : "bg-[#18181B]/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-[#A1A1AA]">
                          {feature.label}
                        </td>
                        {TIER_ORDER.map((plan) => {
                          const val = feature.values[plan];
                          const isCheck = val === "Yes";
                          const isDash = val === "--";

                          return (
                            <td
                              key={plan}
                              className="px-4 py-3 text-center text-sm"
                            >
                              {isCheck ? (
                                <svg
                                  className="mx-auto h-4 w-4 text-[#22C55E]"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <path
                                    d="M13.5 4.5L6.5 11.5L2.5 7.5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : isDash ? (
                                <span className="text-[#3F3F46]">--</span>
                              ) : (
                                <span className="text-[#FAFAFA]">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
