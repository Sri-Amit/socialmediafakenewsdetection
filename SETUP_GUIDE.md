# Fact Checker Pro - Complete Setup Guide

This guide will walk you through setting up the complete Fact Checker Pro system with free tier limits and Pro subscription management.

## System Overview

The system consists of:
1. **Extension** - Chrome extension with fact checking functionality
2. **Website** - Next.js website for user authentication and subscription management
3. **Firebase** - User authentication and data storage
4. **Stripe** - Payment processing for Pro subscriptions

## Architecture

```
Extension (Chrome) ←→ Website (Vercel) ←→ Firebase ←→ Stripe
     ↓                    ↓                ↓         ↓
- Fact checking      - User auth      - User data   - Payments
- Usage tracking     - Pricing page   - Limits      - Webhooks
- Limit enforcement  - Registration   - Plans       - Subscriptions
```

## Step-by-Step Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Generate Service Account:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download the JSON file

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Create Products:
   - Go to Products > Create product
   - Create "Fact Checker Pro Monthly" - $9.99/month
   - Create "Fact Checker Pro Quarterly" - $29.99/quarter
   - Create "Fact Checker Pro Yearly" - $99.99/year
3. Get Price IDs from each product
4. Set up Webhooks:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhook/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret

### 3. Website Setup

1. **Install dependencies:**
   ```bash
   cd website
   npm install
   ```

2. **Create environment file:**
   Create `.env.local` with your Firebase and Stripe credentials:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret

   # Extension API
   EXTENSION_API_KEY=your_secure_random_key
   ```

3. **Update Stripe Price IDs:**
   Edit `src/app/api/create-checkout-session/route.ts` and replace the price IDs with your actual Stripe price IDs.

4. **Test locally:**
   ```bash
   npm run dev
   ```

### 4. Deploy Website to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd website
   vercel
   ```

3. **Configure environment variables in Vercel:**
   - Go to your Vercel project dashboard
   - Settings > Environment Variables
   - Add all variables from your `.env.local`

4. **Update domain in code:**
   Replace `https://your-vercel-app.vercel.app` with your actual Vercel domain in:
   - `popup.js` (lines with your domain)
   - `background.js` (API endpoint URLs)

### 5. Extension Configuration

1. **Update API endpoints:**
   In `background.js` and `popup.js`, replace `https://your-vercel-app.vercel.app` with your actual Vercel domain.

2. **Set API key:**
   Replace `'your-extension-api-key'` with the same value you set in `EXTENSION_API_KEY` environment variable.

3. **Test the extension:**
   - Load the extension in Chrome Developer mode
   - Test fact checking functionality
   - Test user registration and subscription flow

## User Flow

### Free Tier (Default)
1. User installs extension
2. Extension allows fact checking (no authentication required)
3. After 5 fact checks per day, user is prompted to upgrade
4. User can sign up and upgrade to Pro

### Pro Tier
1. User signs up on website
2. User subscribes to Pro plan via Stripe
3. Webhook updates user's plan in Firebase
4. Extension checks user's plan and allows unlimited fact checks

## Testing

### Test Free Tier Limits
1. Use extension without signing in
2. Perform 5 fact checks
3. Verify limit enforcement

### Test Pro Subscription
1. Sign up on website
2. Subscribe to Pro plan
3. Verify unlimited fact checks in extension

### Test Authentication
1. Sign up new user
2. Sign in/out functionality
3. Session persistence

## Monitoring

### Firebase
- Monitor user registrations
- Check Firestore for user data
- Monitor authentication logs

### Stripe
- Monitor payment success/failure
- Check webhook delivery
- Monitor subscription status

### Vercel
- Monitor API endpoint usage
- Check error logs
- Monitor performance

## Security Considerations

1. **API Key Security:**
   - Use strong, random API keys
   - Never commit API keys to version control
   - Rotate keys regularly

2. **Firebase Security:**
   - Use proper Firestore security rules
   - Validate user input
   - Monitor authentication attempts

3. **Stripe Security:**
   - Use webhook signature verification
   - Validate payment data
   - Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **Extension can't connect to API:**
   - Check domain URLs in extension files
   - Verify API key matches
   - Check CORS settings

2. **Stripe payments failing:**
   - Verify price IDs are correct
   - Check webhook endpoint is accessible
   - Verify webhook secret matches

3. **Firebase authentication issues:**
   - Check authorized domains in Firebase
   - Verify API keys are correct
   - Check Firestore security rules

### Support

For issues or questions:
1. Check the browser console for errors
2. Check Vercel function logs
3. Check Firebase console for errors
4. Check Stripe dashboard for payment issues

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Domain URLs updated in extension
- [ ] Stripe webhooks configured
- [ ] Firebase security rules applied
- [ ] Error monitoring set up
- [ ] Payment testing completed
- [ ] User authentication tested
- [ ] Extension limit enforcement tested
- [ ] Pro subscription flow tested

## Cost Estimation

### Firebase
- Free tier: 50,000 reads/day, 20,000 writes/day
- Pro tier: $0.06 per 100,000 reads, $0.18 per 100,000 writes

### Stripe
- 2.9% + 30¢ per successful charge
- No monthly fees

### Vercel
- Free tier: 100GB bandwidth, 100 serverless function executions
- Pro tier: $20/month for unlimited

### Total Monthly Cost
For a small to medium app: ~$20-50/month
