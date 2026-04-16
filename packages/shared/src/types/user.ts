export type Plan = "free" | "lite" | "starter" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  name: string | null;
  authId: string | null;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  onboardingCompleted: boolean;
  referralCode: string | null;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyPrefix: string;
  name: string | null;
  usageToday: number;
  lastUsed: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}
