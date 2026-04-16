"use client";

import { LiquidationHeatmap } from "@/components/dashboard/liquidation-heatmap";
import { FundingComparison } from "@/components/dashboard/funding-comparison";
import { TopLiquidationsFeed } from "@/components/dashboard/top-liquidations-feed";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { UpgradePrompt } from "@/components/shared/upgrade-prompt";
import { useTier } from "@/hooks/use-tier";

export default function DashboardOverview() {
  const { plan, loading, hasAccess } = useTier();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="h-8 w-8 animate-spin text-[#F59E0B]"
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
      </div>
    );
  }

  const isRealtime = hasAccess("lite");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#FAFAFA]">Overview</h1>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            {isRealtime ? "Real-time" : "Delayed"} market data across Binance,
            Bybit and OKX
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#71717A]">Your plan:</span>
          <PlanBadge plan={plan} />
          {!isRealtime && (
            <span className="ml-2 rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] font-medium text-[#F59E0B]">
              15-min delay
            </span>
          )}
        </div>
      </div>

      {/* Liquidation Heatmap */}
      <section>
        <LiquidationHeatmap />
      </section>

      {/* Funding Comparison */}
      <section>
        <FundingComparison />
      </section>

      {/* Liquidations Feed */}
      <section>
        <TopLiquidationsFeed />
      </section>

      {/* Cross-exchange comparison (Pro+) */}
      {!hasAccess("pro") && (
        <section>
          <UpgradePrompt
            requiredPlan="pro"
            featureName="Cross-exchange Comparison"
          />
        </section>
      )}
    </div>
  );
}
