import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingPortalSession } from "@/lib/stripe/checkout";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's stripe customer ID from database
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("auth_id", user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  try {
    const session = await createBillingPortalSession(
      userData.stripe_customer_id
    );
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Portal session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
