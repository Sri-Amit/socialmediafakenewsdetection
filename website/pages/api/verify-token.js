import jwt from 'jsonwebtoken';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    
    console.log('Received token verification request');
    console.log('Token length:', token ? token.length : 'undefined');
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
    
    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify JWT token
    console.log('Attempting to verify token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully:', { uid: decoded.uid, email: decoded.email });
    
    // Get user data from Firestore
    const userDoc = doc(db, 'users', decoded.uid);
    const userSnap = await getDoc(userDoc);
    
    if (!userSnap.exists()) {
      console.log('User not found, creating new user with free plan');
      // User doesn't exist, create with free plan
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userDoc, {
        uid: decoded.uid,
        email: decoded.email,
        subscription: {
          plan: 'free',
          status: 'active'
        },
        createdAt: new Date().toISOString(),
      });
      
      return res.status(200).json({
        success: true,
        plan: 'free',
        status: 'active',
      });
    }

    const userData = userSnap.data();
    console.log('User found in Firestore:', { plan: userData.subscription?.plan, status: userData.subscription?.status });
    
    return res.status(200).json({
      success: true,
      plan: userData.subscription?.plan || 'free',
      status: userData.subscription?.status || 'active',
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
