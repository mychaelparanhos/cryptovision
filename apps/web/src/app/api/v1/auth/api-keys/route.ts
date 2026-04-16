import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";

/**
 * GET /api/v1/auth/api-keys — List user's API keys
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, usage_today, last_used, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }

  return NextResponse.json({ keys });
}

/**
 * POST /api/v1/auth/api-keys — Create a new API key
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string | null = null;
  try {
    const body = await request.json();
    name = body.name || null;
  } catch {
    // No body is fine
  }

  const { fullKey, keyHash, keyPrefix } = generateApiKey();

  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }

  // Return the full key — this is the ONLY time it will be shown
  return NextResponse.json({
    key: fullKey,
    prefix: keyPrefix,
    name,
    message: "Store this key securely. It will not be shown again.",
  });
}
