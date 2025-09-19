"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Check, Zap, Star, Shield } from "lucide-react";

export default function PricingPage() {
  const [user, loading] = useAuthState(auth);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "For casual users",
      price: { monthly: 0, yearly: 0, quarterly: 0 },
      features: [
        "5 fact checks per day",
        "Basic AI analysis",
        "Standard support",
        "Twitter, Instagram, Facebook support"
      ],
      buttonText: "Current Plan",
      buttonDisabled: true,
      popular: false
    },
    {
      id: "pro",
      name: "Pro",
      description: "For professionals",
      price: { monthly: 9.99, yearly: 99.99, quarterly: 29.99 },
      features: [
        "Unlimited fact checks",
        "Advanced AI analysis with grounding",
        "Priority support",
        "All social media platforms",
        "Export fact-check reports",
        "API access"
      ],
      buttonText: "Upgrade to Pro",
      buttonDisabled: false,
      popular: true
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === "pro" && user) {
      // Redirect to Stripe checkout
      try {
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: selectedPlan === "yearly" ? "price_yearly" : selectedPlan === "quarterly" ? "price_quarterly" : "price_monthly",
            userId: user.uid,
            userEmail: user.email
          }),
        });

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">🔍 Fact Checker Pro</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.displayName || user.email}</span>
              <button
                onClick={() => auth.signOut()}
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Fact Checker Premium
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Download unlimited fact checks, Get priority support, Advanced AI analysis and more...
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("quarterly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "quarterly"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPlan === "yearly"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular ? "ring-2 ring-indigo-600 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price[selectedPlan as keyof typeof plan.price]}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{selectedPlan === "yearly" ? "year" : selectedPlan === "quarterly" ? "quarter" : "month"}
                  </span>
                </div>
                {plan.id === "pro" && selectedPlan === "yearly" && (
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      SAVE 17%
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.buttonDisabled}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                  plan.buttonDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {plan.buttonText}
              </button>

              {plan.id === "pro" && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  30 day money back guarantee
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <p className="text-lg font-semibold text-gray-900 mb-8">
            Trusted by over 10,000 users
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Unlimited Fact Checks</h4>
              <p className="text-gray-600 text-sm">Check unlimited posts with advanced AI analysis and real-time source verification.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Advanced AI Analysis</h4>
              <p className="text-gray-600 text-sm">Get deeper insights with enhanced AI models and comprehensive source verification.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Priority Support</h4>
              <p className="text-gray-600 text-sm">Get priority customer support and faster response times for any issues.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
