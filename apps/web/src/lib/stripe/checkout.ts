import { stripe } from "./stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  customerEmail: string,
  couponId?: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(couponId && {
      discounts: [{ coupon: couponId }],
    }),
    success_url: `${APP_URL}/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: { userId },
  });

  return session;
}

export async function createBillingPortalSession(stripeCustomerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/settings/billing`,
  });

  return session;
}
