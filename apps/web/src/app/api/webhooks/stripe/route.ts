import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/stripe";
import { priceToPlan } from "@/lib/stripe/prices";
import { getRedis } from "@/lib/redis";
import type { Plan } from "@cryptovision/shared";

const IDEMPOTENCY_TTL = 172800; // 48 hours in seconds

async function isEventProcessed(eventId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // No Redis = skip idempotency (dev mode)

  // SET NX returns true if key was SET (new event), null if already exists
  const result = await redis.set(
    `cv:stripe:event:${eventId}`,
    "1",
    { nx: true, ex: IDEMPOTENCY_TTL }
  );
  return result === null; // null = already processed
}

async function updateUserPlan(
  stripeCustomerId: string,
  plan: Plan,
  subscriptionId?: string
): Promise<void> {
  // Use Supabase service role to update user
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("users")
    .update({
      plan,
      ...(subscriptionId && { stripe_subscription_id: subscriptionId }),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", stripeCustomerId);

  if (error) {
    console.error(`Failed to update user plan for customer ${stripeCustomerId}:`, error);
    throw error;
  }
}

async function linkCustomerToUser(
  userId: string,
  customerId: string,
  subscriptionId: string,
  plan: Plan
): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("users")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(`Failed to link customer ${customerId} to user ${userId}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check — skip if already processed
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`Skipping duplicate event: ${event.id} (${event.type})`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  console.log(`Processing Stripe event: ${event.id} (${event.type})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("checkout.session.completed: missing userId in metadata");
          break;
        }

        // Get the subscription to find the price/plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? priceToPlan(priceId) : null;

        if (plan) {
          await linkCustomerToUser(userId, customerId, subscriptionId, plan);
          console.log(`User ${userId} upgraded to ${plan} (customer: ${customerId})`);

          // TODO [S2B-8 Referral Reward]: When this user was referred (users.referred_by is set),
          // apply a 1-month credit to the referrer's Stripe account:
          //   1. Look up the user's `referred_by` value (referral code of the referrer)
          //   2. Find the referrer's stripe_customer_id via their referral_code
          //   3. Get the referrer's current plan price
          //   4. Apply credit via stripe.customers.createBalanceTransaction(referrerCustomerId, {
          //        amount: -planPriceInCents, currency: 'usd',
          //        description: `Referral reward: ${userId} upgraded to ${plan}`
          //      })
          //   5. Send email notification to referrer (via email service or Stripe invoice)
        } else {
          console.error(`checkout.session.completed: unknown price ${priceId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? priceToPlan(priceId) : null;

        if (plan && subscription.status === "active") {
          await updateUserPlan(customerId, plan, subscription.id);
          console.log(`Subscription updated: customer ${customerId} → ${plan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await updateUserPlan(customerId, "free");
        console.log(`Subscription cancelled: customer ${customerId} → free`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;
        console.warn(`Payment failed for customer ${customerId}`);
        // TODO: Send email notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing event ${event.id}:`, err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
