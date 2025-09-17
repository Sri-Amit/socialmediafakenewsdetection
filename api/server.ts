import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Load environment variables
const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'chrome-extension://*';
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5');
const STRIPE_SECRET = process.env.STRIPE_SECRET!;
const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

const app = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Helper functions
function todayUtc(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function resetsAtIso(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Auth middleware
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string };
    }
  }
}

// Stub fact check function
async function factCheck(text: string) {
  // TODO: Replace with real logic
  return { 
    verdict: "needs_review", 
    sources: [],
    text: text.substring(0, 100) + '...' // Truncate for demo
  };
}

// Routes

// POST /api/fact-check
app.post('/api/fact-check', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    const uid = req.user!.uid;
    const day = todayUtc();
    const usageDocId = `${uid}_${day}`;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get user plan
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const plan = userData?.plan || 'free';

    // Check usage limit for free users
    if (plan === 'free') {
      const usageRef = db.collection('usage').doc(usageDocId);
      
      await db.runTransaction(async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const currentCount = usageDoc.data()?.count || 0;
        
        if (currentCount >= FREE_DAILY_LIMIT) {
          throw new Error('QUOTA_EXCEEDED');
        }
        
        // Increment usage count
        transaction.set(usageRef, {
          uid,
          day,
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      });
    }

    // Perform fact check
    const result = await factCheck(text);
    
    res.json({ 
      ok: true, 
      result,
      plan,
      usage: plan === 'free' ? {
        used: (await db.collection('usage').doc(usageDocId).get()).data()?.count || 0,
        limit: FREE_DAILY_LIMIT
      } : null
    });

  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      const day = todayUtc();
      const resetsAt = resetsAtIso();
      
      return res.status(402).json({
        error: 'quota_exceeded',
        limit: FREE_DAILY_LIMIT,
        used: FREE_DAILY_LIMIT,
        day,
        resetsAt
      });
    }
    
    console.error('Fact check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/me/limits
app.get('/api/me/limits', requireAuth, async (req, res) => {
  try {
    const uid = req.user!.uid;
    const day = todayUtc();
    const usageDocId = `${uid}_${day}`;

    // Get user data
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const plan = userData?.plan || 'free';

    // Get usage data
    const usageDoc = await db.collection('usage').doc(usageDocId).get();
    const usageData = usageDoc.data();
    const used = usageData?.count || 0;

    res.json({
      plan,
      used,
      limit: plan === 'pro' ? null : FREE_DAILY_LIMIT,
      day,
      resetsAt: resetsAtIso()
    });

  } catch (error) {
    console.error('Limits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/create-checkout-session
app.post('/api/billing/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const uid = req.user!.uid;
    
    // Get or create Stripe customer
    let userDoc = await db.collection('users').doc(uid).get();
    let userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        metadata: { uid }
      });
      stripeCustomerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(uid).set({
        stripeCustomerId,
        plan: 'free',
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PRICE_PRO,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: { uid }
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/webhook
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const body = req.body;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        
        if (uid) {
          await db.collection('users').doc(uid).update({
            plan: 'pro',
            updatedAt: FieldValue.serverTimestamp()
          });
          console.log(`User ${uid} upgraded to pro`);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const userQuery = await db.collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        
        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          const plan = subscription.status === 'active' ? 'pro' : 'free';
          
          await userDoc.ref.update({
            plan,
            updatedAt: FieldValue.serverTimestamp()
          });
          
          console.log(`User ${userDoc.id} plan updated to ${plan}`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Free daily limit: ${FREE_DAILY_LIMIT}`);
});
