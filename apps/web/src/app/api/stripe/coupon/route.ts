import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/stripe";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing coupon code" },
      { status: 400 }
    );
  }

  try {
    // Retrieve the coupon (promotion code) from Stripe
    // First try as a promotion code, then as a coupon ID directly
    let coupon;
    let promoCode;

    try {
      // Try looking up as a promotion code first
      const promoCodes = await stripe.promotionCodes.list({
        code: code.toUpperCase(),
        limit: 1,
      });

      if (promoCodes.data.length > 0) {
        promoCode = promoCodes.data[0];
        coupon =
          typeof promoCode.coupon === "string"
            ? await stripe.coupons.retrieve(promoCode.coupon)
            : promoCode.coupon;
      }
    } catch {
      // Not a promotion code, try direct coupon lookup
    }

    if (!coupon) {
      try {
        coupon = await stripe.coupons.retrieve(code.toUpperCase());
      } catch {
        return NextResponse.json(
          {
            valid: false,
            error: "Invalid coupon code",
          },
          { status: 200 }
        );
      }
    }

    // Check if coupon is still valid
    if (!coupon.valid) {
      return NextResponse.json({
        valid: false,
        error: "Coupon has expired",
      });
    }

    // Calculate remaining redemptions
    const maxRedemptions = coupon.max_redemptions;
    const timesRedeemed = coupon.times_redeemed;
    const remaining = maxRedemptions
      ? maxRedemptions - timesRedeemed
      : null;

    if (remaining !== null && remaining <= 0) {
      return NextResponse.json({
        valid: false,
        error: "Coupon fully redeemed",
      });
    }

    // Build discount description
    let discount = "";
    if (coupon.percent_off) {
      discount = `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      const currency = (coupon.currency || "usd").toUpperCase();
      discount = `${(coupon.amount_off / 100).toFixed(2)} ${currency} off`;
    }

    if (coupon.duration === "forever") {
      discount += " forever";
    } else if (coupon.duration === "repeating" && coupon.duration_in_months) {
      discount += ` for ${coupon.duration_in_months} months`;
    } else if (coupon.duration === "once") {
      discount += " (first payment)";
    }

    return NextResponse.json({
      valid: true,
      discount,
      remaining,
      couponId: coupon.id,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
