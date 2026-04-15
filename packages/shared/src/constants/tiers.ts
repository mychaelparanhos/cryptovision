import type { Plan } from "../types";

export interface TierLimits {
  name: string;
  monthlyPrice: number;
  annualPrice: number | null;
  apiReqPerDay: number;
  wsSymbols: number;
  historicalDays: number;
  maxAlerts: number;
  features: string[];
}

export const TIER_LIMITS: Record<Plan, TierLimits> = {
  free: {
    name: "Market Pulse",
    monthlyPrice: 0,
    annualPrice: null,
    apiReqPerDay: 100,
    wsSymbols: 0,
    historicalDays: 0,
    maxAlerts: 0,
    features: [
      "aggregated_heatmap_delayed",
      "funding_delayed",
      "oi_delayed",
      "liquidations_delayed",
      "curated_dashboard",
      "education_tooltips",
    ],
  },
  lite: {
    name: "Pulse Pro",
    monthlyPrice: 14,
    annualPrice: 140,
    apiReqPerDay: 200,
    wsSymbols: 5,
    historicalDays: 3,
    maxAlerts: 3,
    features: [
      "realtime_data",
      "per_exchange_toggle",
      "telegram_alerts_fixed",
    ],
  },
  starter: {
    name: "Signal Feed",
    monthlyPrice: 29,
    annualPrice: 290,
    apiReqPerDay: 1000,
    wsSymbols: 20,
    historicalDays: 7,
    maxAlerts: -1,
    features: [
      "rich_alerts",
      "custom_alerts_unlimited",
      "agg_trades_top20",
      "long_short_ratio",
      "api_access",
      "vpin_top5",
    ],
  },
  pro: {
    name: "Deep Analytics",
    monthlyPrice: 99,
    annualPrice: 990,
    apiReqPerDay: 50000,
    wsSymbols: -1,
    historicalDays: 90,
    maxAlerts: -1,
    features: [
      "cross_exchange_comparison",
      "oi_divergence",
      "custom_webhooks",
      "agg_trades_all",
      "vpin_all",
      "confluence_score",
      "ai_market_brief",
    ],
  },
  enterprise: {
    name: "Quant Engine",
    monthlyPrice: 299,
    annualPrice: null,
    apiReqPerDay: -1,
    wsSymbols: -1,
    historicalDays: -1,
    maxAlerts: -1,
    features: [
      "data_export_csv",
      "dedicated_ws_channel",
      "priority_support",
      "rwa_perps",
    ],
  },
} as const;

export const TIER_ORDER: Plan[] = [
  "free",
  "lite",
  "starter",
  "pro",
  "enterprise",
];

export function hasTierAccess(userTier: Plan, requiredTier: Plan): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}
