import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get the API key from headers
    const apiKey = request.headers.get("x-api-key");
    const userId = request.headers.get("x-user-id");

    if (!apiKey || apiKey !== process.env.EXTENSION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      // Return free tier defaults if user doesn't exist
      return NextResponse.json({
        plan: "free",
        factChecksUsed: 0,
        factChecksLimit: 5,
        canUseFactCheck: true,
        resetTime: getNextResetTime()
      });
    }

    const userData = userDoc.data()!;
    const today = new Date().toDateString();
    
    // Reset daily count if it's a new day
    if (userData.lastResetDate !== today) {
      await adminDb.collection("users").doc(userId).update({
        factChecksUsed: 0,
        lastResetDate: today
      });
      userData.factChecksUsed = 0;
      userData.lastResetDate = today;
    }

    const plan = userData.plan || "free";
    const factChecksLimit = plan === "pro" ? Infinity : 5;
    const factChecksUsed = userData.factChecksUsed || 0;
    const canUseFactCheck = factChecksUsed < factChecksLimit;

    return NextResponse.json({
      plan,
      factChecksUsed,
      factChecksLimit: plan === "pro" ? -1 : factChecksLimit, // -1 for unlimited
      canUseFactCheck,
      resetTime: getNextResetTime()
    });

  } catch (error) {
    console.error("Error getting user limits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the API key from headers
    const apiKey = request.headers.get("x-api-key");
    const userId = request.headers.get("x-user-id");

    if (!apiKey || apiKey !== process.env.EXTENSION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Increment fact check usage
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user with free tier
      await userRef.set({
        plan: "free",
        factChecksUsed: 1,
        factChecksLimit: 5,
        lastResetDate: new Date().toDateString(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      const userData = userDoc.data()!;
      const today = new Date().toDateString();
      
      // Reset daily count if it's a new day
      if (userData.lastResetDate !== today) {
        await userRef.update({
          factChecksUsed: 1,
          lastResetDate: today
        });
      } else {
        // Increment existing count
        const newCount = (userData.factChecksUsed || 0) + 1;
        await userRef.update({
          factChecksUsed: newCount
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating fact check usage:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getNextResetTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
