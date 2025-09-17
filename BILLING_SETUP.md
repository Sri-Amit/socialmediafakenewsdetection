# Fact Checker Extension - Billing Setup Guide

This guide will help you set up the free tier (5 checks/day) and Pro (unlimited) billing system for your Chrome extension.

## 🏗️ Architecture

- **Backend**: Node.js + Express + Firebase Admin + Stripe
- **Frontend**: Chrome Extension with Firebase Auth
- **Security**: All gating happens server-side; no secrets in extension

## 📁 File Structure

```
/api
├── server.ts              # Express server with auth & billing
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── .env.example          # Environment variables template

/extension
├── manifest.json          # Chrome extension manifest
├── popup.html            # Extension popup UI
└── popup.js              # Firebase Auth + API integration
```

## 🚀 Backend Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication → Google provider
3. Enable Firestore Database
4. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `service-account.json` in the `/api` folder

### 3. Stripe Setup

1. Create a Stripe account at https://dashboard.stripe.com
2. Get your API keys from Developers → API Keys
3. Create a recurring price for Pro subscription:
   - Go to Products → Create Product
   - Set up recurring pricing (e.g., $9.99/month)
   - Copy the Price ID (starts with `price_`)
4. Set up webhook endpoint:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/billing/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret

### 4. Environment Variables

Create `.env` file in `/api` folder:

```env
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
STRIPE_SECRET=sk_test_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGIN=chrome-extension://*
FREE_DAILY_LIMIT=5
```

### 5. Deploy Backend

Deploy to your preferred platform (Heroku, Railway, Vercel, etc.) and update `YOUR-API-HOST` in the extension files.

## 🔧 Extension Setup

### 1. Firebase Config

Update `popup.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. API Host

Update `YOUR-API-HOST` in:
- `extension/manifest.json` (host_permissions)
- `extension/popup.js` (API_BASE)

### 3. Load Extension

1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked"
3. Select the `/extension` folder

## 🧪 Testing

### Test Free Tier Limits

1. Sign in with Google
2. Perform 5 fact checks (should work)
3. Try 6th fact check (should show quota exceeded)
4. Click "Upgrade to Pro" (opens Stripe Checkout)

### Test Pro Upgrade

1. Complete Stripe Checkout with test card: `4242 4242 4242 4242`
2. Check webhook logs for successful processing
3. Verify user plan updated to "pro" in Firestore
4. Test unlimited fact checks

### Test Webhook

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:8080/api/billing/webhook
```

## 📊 Firestore Collections

### `users/{uid}`
```json
{
  "plan": "free" | "pro",
  "stripeCustomerId": "cus_xxx",
  "updatedAt": "timestamp"
}
```

### `usage/{uid}_{YYYY-MM-DD}`
```json
{
  "uid": "user_id",
  "day": "2024-01-15",
  "count": 3,
  "updatedAt": "timestamp"
}
```

## 🔒 Security Features

- **Server-side gating**: All limits enforced on backend
- **No secrets in extension**: API keys only on server
- **Firebase Auth**: Secure user authentication
- **Stripe webhooks**: Secure payment processing
- **CORS protection**: Only allows extension origins

## 🚨 Troubleshooting

### Extension not loading
- Check manifest.json permissions
- Verify API host URL is correct
- Check browser console for errors

### Auth not working
- Verify Firebase config is correct
- Check Firebase Auth is enabled
- Ensure Google provider is configured

### Billing not working
- Verify Stripe keys are correct
- Check webhook endpoint is accessible
- Verify webhook events are configured
- Check server logs for errors

### Quota not enforced
- Check Firestore rules allow writes
- Verify server is running
- Check API endpoint is accessible

## 📈 Monitoring

Monitor these metrics:
- Daily fact check usage
- Conversion rate (free → pro)
- API response times
- Error rates
- Stripe webhook success rate

## 🔄 Updates

To update the extension:
1. Make changes to `/extension` files
2. Reload extension in Chrome
3. Test functionality

To update the backend:
1. Deploy new version
2. Test API endpoints
3. Verify webhooks still work
