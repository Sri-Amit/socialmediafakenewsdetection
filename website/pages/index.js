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

export default function Home() {
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

  const handleUpgrade = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid,
          email: user.email 
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

  const handleExtensionRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl && user) {
      // Generate JWT token for extension
      const token = generateJWT(user.uid, user.email);
      window.location.href = `${redirectUrl}#${token}`;
    }
  };

  const generateJWT = (uid, email) => {
    // This is a simplified JWT generation - in production, use a proper JWT library
    const payload = {
      uid,
      email,
      plan: subscription?.plan || 'free',
      status: subscription?.status || 'active',
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    };
    
    // In production, use jsonwebtoken library with proper secret
    return btoa(JSON.stringify(payload));
  };

  useEffect(() => {
    // Check if this is a redirect from extension
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl && user) {
      handleExtensionRedirect();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              🔍 Fact Checker Pro
            </h1>
            <p className="text-xl text-blue-100">
              Upgrade to unlimited fact-checking with AI-powered analysis
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
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {processing ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Current Plan
                </h2>
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {subscription?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </div>
                  <div className="text-gray-600">
                    {subscription?.plan === 'pro' 
                      ? 'Unlimited fact checks' 
                      : '5 fact checks per day'
                    }
                  </div>
                </div>
                
                {subscription?.plan !== 'pro' && (
                  <button
                    onClick={handleUpgrade}
                    disabled={processing}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Upgrade to Pro - $9.99/month'}
                  </button>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Sign Out
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Pro Features
                </h2>
                <ul className="space-y-4">
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
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3">✅</span>
                    <span>Early access to new features</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
