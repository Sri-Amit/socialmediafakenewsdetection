import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  
  if (!userId) {
    console.error("No userId in session metadata");
    return;
  }

  // Update user plan to pro
  await adminDb.collection("users").doc(userId).update({
    plan: "pro",
    subscriptionId: session.subscription,
    updatedAt: new Date()
  });

  console.log(`User ${userId} upgraded to pro plan`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const plan = subscription.status === "active" ? "pro" : "free";
  
  await adminDb.collection("users").doc(userId).update({
    plan: plan,
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    updatedAt: new Date()
  });

  console.log(`User ${userId} subscription updated to ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  // Downgrade user to free plan
  await adminDb.collection("users").doc(userId).update({
    plan: "free",
    subscriptionId: null,
    subscriptionStatus: "cancelled",
    updatedAt: new Date()
  });

  console.log(`User ${userId} subscription cancelled, downgraded to free`);
}
