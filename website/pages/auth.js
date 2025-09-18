import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import jwt from 'jsonwebtoken';

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

export default function Auth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Generate JWT token and redirect to extension
        const token = jwt.sign(
          {
            uid: user.uid,
            email: user.email,
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
          },
          process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback-secret'
        );
        
        const { redirect } = router.query;
        if (redirect) {
          window.location.href = `${redirect}#${token}`;
        }
      }
    });

    return () => unsubscribe();
  }, [router.query]);

  const handleGoogleSignIn = async () => {
    try {
      setProcessing(true);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔍 Fact Checker
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to upgrade to Pro and get unlimited fact checks
          </p>
          
          {!user ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={processing}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {processing ? 'Signing in...' : 'Sign in with Google'}
            </button>
          ) : (
            <div className="text-green-600">
              ✅ Signed in successfully! Redirecting to extension...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
