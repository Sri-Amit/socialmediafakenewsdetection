import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

const PRICE_IDS = {
  monthly: "price_1QXXXXXXXXXXXXXXX", // Replace with your actual Stripe price IDs
  quarterly: "price_1QXXXXXXXXXXXXXXX",
  yearly: "price_1QXXXXXXXXXXXXXXX"
};

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail } = await request.json();

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: userId,
        priceId: priceId
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
