import { stripe } from "./stripe";

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  customerEmail: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3000"}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3000"}/dashboard?checkout=cancelled`,
    metadata: { userId },
  });

  return session;
}

export async function createBillingPortalSession(stripeCustomerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : "http://localhost:3000"}/settings`,
  });

  return session;
}
