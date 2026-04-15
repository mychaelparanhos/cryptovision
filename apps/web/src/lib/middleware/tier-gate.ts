import type { Plan } from "@cryptovision/shared";
import { TIER_ORDER } from "@cryptovision/shared";
import { NextResponse } from "next/server";

export function tierGateResponse(currentPlan: Plan, requiredPlan: Plan) {
  if (TIER_ORDER.indexOf(currentPlan) >= TIER_ORDER.indexOf(requiredPlan)) {
    return null; // Access granted
  }

  return NextResponse.json(
    {
      error: "upgrade_required",
      current_plan: currentPlan,
      required_plan: requiredPlan,
      upgrade_url: "/settings/billing",
    },
    { status: 403 }
  );
}
