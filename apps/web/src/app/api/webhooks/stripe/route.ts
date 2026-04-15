import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Dynamic import to avoid build errors when STRIPE_SECRET_KEY is not set
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      console.log(
        `Checkout completed: user=${userId}, customer=${customerId}, subscription=${subscriptionId}`
      );
      // TODO: Update user.plan, stripeCustomerId, stripeSubscriptionId in Supabase
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.log(
        `Subscription updated: ${subscription.id}, status=${subscription.status}`
      );
      // TODO: Update user.plan based on subscription price → tier mapping
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(`Subscription cancelled: ${subscription.id}`);
      // TODO: Downgrade user.plan to 'free'
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
