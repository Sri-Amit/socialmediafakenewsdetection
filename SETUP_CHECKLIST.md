# 🚀 Quick Setup Checklist

Follow these steps to get your billing system running:

## 1. 🔥 Firebase Setup (5 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Name it "fact-checker-billing" (or whatever you prefer)
4. Enable Google Analytics (optional)

### Enable Authentication
1. In Firebase Console → Authentication → Sign-in method
2. Click "Google" → Enable
3. Add your domain to authorized domains

### Enable Firestore Database
1. Go to Firestore Database → Create database
2. Start in test mode (we'll secure it later)
3. Choose a location close to you

### Get Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `service-account.json`
5. Move it to your `/api` folder

## 2. 💳 Stripe Setup (5 minutes)

### Create Stripe Account
1. Go to https://dashboard.stripe.com
2. Sign up for free account
3. Complete account setup

### Get API Keys
1. Go to Developers → API Keys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Keep this page open for later

### Create Pro Subscription Product
1. Go to Products → Create Product
2. Name: "Fact Checker Pro"
3. Description: "Unlimited fact checks"
4. Pricing: Recurring → $9.99/month (or your price)
5. Copy the **Price ID** (starts with `price_`)

### Set Up Webhook (for later)
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/billing/webhook` (we'll get this after deployment)
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## 3. 🖥️ Backend Setup (10 minutes)

### Install Dependencies
```bash
cd api
npm install
```

### Create Environment File
1. Copy `api/.env.example` to `api/.env`
2. Fill in your values:

```env
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
STRIPE_SECRET=sk_test_your_stripe_secret_here
STRIPE_PRICE_PRO=price_your_price_id_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
CORS_ORIGIN=chrome-extension://*
FREE_DAILY_LIMIT=5
```

### Test Backend Locally
```bash
npm run dev
```

You should see:
```
Server running on port 8080
CORS origin: chrome-extension://*
Free daily limit: 5
```

## 4. 🌐 Deploy Backend (15 minutes)

### Option A: Railway (Recommended)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-detect Node.js
6. Add environment variables in Railway dashboard
7. Deploy!

### Option B: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set STRIPE_SECRET=sk_test_...`
4. `git push heroku main`

### Option C: Vercel
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set environment variables
4. Deploy!

### Get Your API URL
After deployment, you'll get a URL like:
- Railway: `https://your-app.railway.app`
- Heroku: `https://your-app.herokuapp.com`
- Vercel: `https://your-app.vercel.app`

## 5. 🔧 Update Extension (5 minutes)

### Update Firebase Config
1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" → Web app
3. Copy the config object
4. Update `extension/popup.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Update API Host
1. Update `extension/manifest.json`:
```json
"host_permissions": [
  "https://your-deployed-api-url.com/*"
]
```

2. Update `extension/popup.js`:
```javascript
const API_BASE = 'https://your-deployed-api-url.com';
```

## 6. 🧪 Test Everything (10 minutes)

### Load Extension
1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked"
3. Select the `/extension` folder

### Test Free Tier
1. Click extension icon
2. Sign in with Google
3. Try fact-checking some text
4. Should show "Free: 1/5" usage

### Test Pro Upgrade
1. After 5 fact checks, try 6th
2. Should show quota exceeded
3. Click "Upgrade to Pro"
4. Complete Stripe checkout with test card: `4242 4242 4242 4242`
5. Should upgrade to Pro

## 7. 🔒 Secure Firestore (5 minutes)

### Update Firestore Rules
Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Usage tracking - users can only access their own usage
    match /usage/{usageId} {
      allow read, write: if request.auth != null && 
        usageId.matches('.*_' + request.auth.uid + '_.*');
    }
  }
}
```

## 8. 🎉 You're Done!

Your billing system is now live with:
- ✅ Free tier: 5 fact checks per day
- ✅ Pro tier: Unlimited fact checks
- ✅ Secure authentication
- ✅ Stripe payments
- ✅ Server-side enforcement

## 🆘 Need Help?

### Common Issues:
1. **Extension not loading**: Check manifest.json permissions
2. **Auth not working**: Verify Firebase config
3. **API errors**: Check backend logs
4. **Billing not working**: Verify Stripe webhook

### Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Debugging:
- Check browser console for errors
- Check backend logs
- Verify environment variables
- Test API endpoints with curl

## 📊 Monitor Usage

Check your Stripe dashboard for:
- Successful payments
- Failed payments
- Customer subscriptions

Check Firebase Console for:
- User authentication
- Firestore data
- Usage analytics
