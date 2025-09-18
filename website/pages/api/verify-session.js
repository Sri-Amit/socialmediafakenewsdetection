import Stripe from 'stripe';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const uid = session.metadata.uid;
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID not found in session' });
    }

    // Update user subscription in Firestore
    const userDoc = doc(db, 'users', uid);
    await setDoc(userDoc, {
      subscription: {
        plan: 'pro',
        status: 'active',
        stripeSubscriptionId: session.subscription,
        stripeSessionId: sessionId,
        updatedAt: new Date().toISOString(),
      },
    }, { merge: true });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
