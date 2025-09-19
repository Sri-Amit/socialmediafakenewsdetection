import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function Billing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await checkSubscriptionStatus(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkSubscriptionStatus = async (uid) => {
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setProcessing(true);
      const result = await signInWithPopup(auth, provider);
      console.log('User signed in:', result.user);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpgrade = async (plan = 'monthly') => {
    try {
      setProcessing(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid,
          email: user.email,
          plan: plan
        }),
      });
      
      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('Stripe error:', error);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Get Fact Checker Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Verify social media posts with unlimited fact checks, priority processing, and advanced AI analysis
            </p>
          </div>

          {!user ? (
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Sign in to upgrade
              </h2>
              <button
                onClick={handleGoogleSignIn}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {processing ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <>
              {subscription?.plan === 'pro' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-md mx-auto text-center">
                  <div className="text-green-600 text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Pro Plan Active</h2>
                  <p className="text-green-600 mb-6">You have unlimited fact checks!</p>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  {/* Pricing Cards */}
                  <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Monthly Plan */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition duration-200">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
                        <div className="text-4xl font-bold text-blue-600 mb-2">$9.99</div>
                        <p className="text-gray-600">For professionals</p>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Unlimited fact checks</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Priority processing</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Premium support</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('monthly')}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Get Monthly'}
                      </button>
                    </div>

                    {/* Quarterly Plan */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-500 relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                          POPULAR
                        </span>
                      </div>
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Quarterly</h3>
                        <div className="text-4xl font-bold text-blue-600 mb-2">$24.99</div>
                        <p className="text-gray-600">Save 17%</p>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Unlimited fact checks</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Priority processing</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Premium support</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('quarterly')}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Get Quarterly'}
                      </button>
                    </div>

                    {/* Yearly Plan */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition duration-200">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                          SAVE 58%
                        </span>
                      </div>
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Yearly</h3>
                        <div className="text-4xl font-bold text-blue-600 mb-2">$49.99</div>
                        <p className="text-gray-600">Best value</p>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Unlimited fact checks</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Priority processing</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Advanced analytics</span>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-500 mr-3">✅</span>
                          <span>Premium support</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('yearly')}
                        disabled={processing}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {processing ? 'Processing...' : 'Get Yearly'}
                      </button>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="text-center">
                      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Unlimited Fact Checks</h3>
                      <p className="text-gray-600">No daily limits, verify as many posts as you need with AI-powered analysis.</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Priority Processing</h3>
                      <p className="text-gray-600">Get faster results with priority queue processing for Pro users.</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📊</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                      <p className="text-gray-600">Detailed insights into fact-checking patterns and credibility trends.</p>
                    </div>
                  </div>

                  {/* Trust Section */}
                  <div className="text-center mb-8">
                    <p className="text-lg text-gray-600 mb-4">Trusted by thousands of users worldwide</p>
                    <div className="flex justify-center items-center space-x-8 text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">50K+</div>
                        <div className="text-sm">Downloads</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">4.8★</div>
                        <div className="text-sm">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">99.9%</div>
                        <div className="text-sm">Uptime</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleSignOut}
                      className="text-gray-500 hover:text-gray-700 underline"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
