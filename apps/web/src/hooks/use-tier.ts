"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@cryptovision/shared";
import { TIER_ORDER } from "@cryptovision/shared";
import { createClient } from "@/lib/supabase/client";

interface UseTierReturn {
  plan: Plan;
  loading: boolean;
  hasAccess: (requiredPlan: Plan) => boolean;
}

export function useTier(): UseTierReturn {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlan() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setPlan("free");
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("plan")
          .eq("id", user.id)
          .single();

        if (!cancelled) {
          if (error || !data) {
            setPlan("free");
          } else {
            setPlan((data.plan as Plan) || "free");
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlan("free");
          setLoading(false);
        }
      }
    }

    fetchPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  function hasAccess(requiredPlan: Plan): boolean {
    return TIER_ORDER.indexOf(plan) >= TIER_ORDER.indexOf(requiredPlan);
  }

  return { plan, loading, hasAccess };
}
