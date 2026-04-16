import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/v1/auth/api-keys/[id] — Revoke an API key
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the key belongs to this user before revoking
  const { data: existing } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "API key revoked" });
}
