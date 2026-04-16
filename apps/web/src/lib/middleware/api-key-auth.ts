import { NextRequest, NextResponse } from "next/server";
import { hashApiKey, isValidApiKeyFormat } from "@/lib/api-keys";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@cryptovision/shared";
import { checkRateLimit } from "@/lib/rate-limit";

export interface ApiKeyUser {
  userId: string;
  plan: Plan;
  keyId: string;
}

/**
 * Authenticate a request via API key (Bearer token).
 * Returns user info if valid, or a NextResponse error.
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyUser | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  if (!isValidApiKeyFormat(apiKey)) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  const keyHash = hashApiKey(apiKey);

  // Look up in database
  const supabase = await createClient();
  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  if (keyRecord.revoked_at) {
    return NextResponse.json(
      { error: "API key has been revoked" },
      { status: 401 }
    );
  }

  // Get user plan
  const { data: user } = await supabase
    .from("users")
    .select("plan")
    .eq("id", keyRecord.user_id)
    .single();

  const plan = (user?.plan as Plan) || "free";

  // Check rate limit
  const rateResult = await checkRateLimit(`apikey:${keyRecord.id}`, plan);
  if (!rateResult.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        limit: rateResult.limit,
        reset: rateResult.reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateResult.reset),
        },
      }
    );
  }

  // Update usage
  await supabase
    .from("api_keys")
    .update({
      usage_today: (keyRecord as Record<string, unknown>).usage_today
        ? Number((keyRecord as Record<string, unknown>).usage_today) + 1
        : 1,
      last_used: new Date().toISOString(),
    })
    .eq("id", keyRecord.id);

  return {
    userId: keyRecord.user_id,
    plan,
    keyId: keyRecord.id,
  };
}
