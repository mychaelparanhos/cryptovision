"use client";

import Link from "next/link";
import type { Plan } from "@cryptovision/shared";

interface PlanBadgeProps {
  plan: Plan;
}

const PLAN_CONFIG: Record<Plan, { label: string; color: string }> = {
  free: { label: "Free", color: "#71717A" },
  lite: { label: "Lite", color: "#3B82F6" },
  starter: { label: "Starter", color: "#F59E0B" },
  pro: { label: "Pro", color: "#8B5CF6" },
  enterprise: { label: "Enterprise", color: "#EF4444" },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan];

  return (
    <Link
      href="/settings/billing"
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      {config.label}
    </Link>
  );
}
