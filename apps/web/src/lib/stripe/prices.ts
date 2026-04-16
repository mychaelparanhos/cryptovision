import type { Plan } from "@cryptovision/shared";

// Stripe Price IDs — configured per environment
// Set these in .env after creating products in Stripe Dashboard
export const STRIPE_PRICES = {
  lite_monthly: process.env.STRIPE_PRICE_LITE_MONTHLY || "",
  lite_annual: process.env.STRIPE_PRICE_LITE_ANNUAL || "",
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "",
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
} as const;

// Map Stripe price ID → CryptoVision plan tier
export function priceToPlan(priceId: string): Plan | null {
  const map: Record<string, Plan> = {
    [STRIPE_PRICES.lite_monthly]: "lite",
    [STRIPE_PRICES.lite_annual]: "lite",
    [STRIPE_PRICES.starter_monthly]: "starter",
    [STRIPE_PRICES.starter_annual]: "starter",
    [STRIPE_PRICES.pro_monthly]: "pro",
    [STRIPE_PRICES.pro_annual]: "pro",
    [STRIPE_PRICES.enterprise_monthly]: "enterprise",
  };

  return map[priceId] || null;
}
