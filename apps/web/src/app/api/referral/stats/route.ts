import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the current user's referral code
    const { data: userData } = await supabase
      .from("users")
      .select("referral_code")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.referral_code) {
      return NextResponse.json({
        referralCode: null,
        signups: 0,
        upgrades: 0,
      });
    }

    const referralCode = userData.referral_code;

    // Count users who signed up with this referral code
    const { count: signups } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", referralCode);

    // Count users who signed up with this referral code AND upgraded (plan != 'free')
    const { count: upgrades } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", referralCode)
      .neq("plan", "free");

    return NextResponse.json({
      referralCode,
      signups: signups ?? 0,
      upgrades: upgrades ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
