import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("waitlist")
      .select("position, referral_code")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({
        position: existing.position,
        referralCode: existing.referral_code,
        existing: true,
      });
    }

    // Get current count for position
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    const position = (count ?? 0) + 1;
    const referralCode = randomBytes(4).toString("hex");

    const { error } = await supabase.from("waitlist").insert({
      email: email.toLowerCase(),
      position,
      referral_code: referralCode,
    });

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to join" }, { status: 500 });
    }

    // Send welcome email async (don't block response)
    sendWelcomeEmail(email, position).catch(console.error);

    return NextResponse.json({ position, referralCode, existing: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendWelcomeEmail(email: string, position: number) {
  if (!process.env.RESEND_API_KEY) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "CryptoVision <onboarding@resend.dev>",
    to: email,
    subject: "You're on the list!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to CryptoVision</h2>
        <p>You're <strong>#${position}</strong> on the waitlist.</p>
        <p>While you wait, check out our <a href="https://cryptovision.io/screener">live screener</a> — it's free.</p>
        <p>Follow us on <a href="https://twitter.com/CryptoVision">X/Twitter</a> for daily crypto futures insights.</p>
        <br>
        <p style="color: #666; font-size: 12px;">Institutional data at retail prices.</p>
      </div>
    `,
  });
}
