import Stripe from 'stripe';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
    const { uid, email } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({ error: 'User ID and email are required' });
    }

    // Check if user already has a subscription
    const userDoc = doc(db, 'users', uid);
    const userSnap = await getDoc(userDoc);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.subscription?.plan === 'pro' && userData.subscription?.status === 'active') {
        return res.status(400).json({ error: 'User already has an active subscription' });
      }
    }

    // Create or retrieve Stripe customer
    let customerId;
    if (userSnap.exists() && userSnap.data().stripeCustomerId) {
      customerId = userSnap.data().stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { uid },
      });
      customerId = customer.id;
      
      // Save customer ID to Firestore
      await setDoc(userDoc, {
        stripeCustomerId: customerId,
        email: email,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Fact Checker Pro',
              description: 'Unlimited fact checks with AI-powered analysis',
            },
            unit_amount: 999, // $9.99
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      metadata: {
        uid: uid,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
