"use client";

import Link from "next/link";
import type { Plan } from "@cryptovision/shared";

interface UpgradePromptProps {
  requiredPlan: Plan;
  featureName?: string;
}

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  lite: "Lite",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function UpgradePrompt({ requiredPlan, featureName }: UpgradePromptProps) {
  const planLabel = PLAN_LABELS[requiredPlan];

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] p-8 text-center">
      {/* Lock Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#27272A]">
        <svg
          className="h-6 w-6 text-[#71717A]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[#FAFAFA]">
        {featureName
          ? `${featureName} requires ${planLabel}`
          : `Upgrade to ${planLabel} to access this feature`}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-[#A1A1AA]">
        Unlock this feature and more by upgrading your plan. All plans include
        aggregated data from Binance, Bybit and OKX.
      </p>

      <Link
        href="/pricing"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#D97706]"
      >
        View Plans
      </Link>
    </div>
  );
}
