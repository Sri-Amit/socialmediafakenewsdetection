# Fact Checker Extension - Freemium Deployment Guide

This guide will help you deploy the Fact Checker Extension with a freemium model using Firebase authentication and Stripe payments.

## Overview

The system consists of:
1. **Chrome Extension** - The fact-checking extension with usage limits
2. **Vercel Website** - Authentication and payment processing
3. **Firebase** - User authentication and subscription storage
4. **Stripe** - Payment processing

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication
4. Create a Firestore database

### 1.2 Configure Authentication
1. Go to Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains

### 1.3 Set up Firestore
1. Go to Firestore Database
2. Create the following security rules:

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

### 1.4 Get Firebase Configuration
1. Go to Project Settings > General
2. Scroll down to "Your apps"
3. Add a web app and copy the configuration

## Step 2: Stripe Setup

### 2.1 Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Complete account setup
3. Get your API keys from Developers > API keys

### 2.2 Set up Webhook
1. Go to Developers > Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret

## Step 3: Deploy Website to Vercel

### 3.1 Prepare Website
1. Navigate to the `website` folder
2. Install dependencies:
```bash
cd website
npm install
```

### 3.2 Configure Environment Variables
Create `.env.local` with:
```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT Secret
JWT_SECRET=your_secure_jwt_secret
```

### 3.3 Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the website directory
3. Set environment variables in Vercel dashboard
4. Update the website URL in the extension code

## Step 4: Update Extension

### 4.1 Update Website URLs
In `background.js`, update these URLs:
```javascript
const websiteUrl = 'https://your-actual-domain.vercel.app';
```

### 4.2 Update Manifest
The manifest.json already includes the necessary permissions:
- `storage` - for usage tracking
- `identity` - for Chrome identity flow

### 4.3 Test Extension
1. Load the extension in Chrome
2. Test the fact-checking functionality
3. Verify usage limits work
4. Test the upgrade flow

## Step 5: Configure Extension for Production

### 5.1 Update API Keys
1. Replace `YOUR-API-KEY-HERE` in `background.js` with your actual Gemini API key
2. Update the website URL in `background.js`

### 5.2 Test the Complete Flow
1. Install the extension
2. Try fact-checking (should work for free users)
3. Hit the daily limit (5 checks)
4. Click upgrade button
5. Complete authentication and payment
6. Verify unlimited access

## Step 6: Production Considerations

### 6.1 Security
- Use strong JWT secrets
- Implement rate limiting
- Validate all inputs
- Use HTTPS everywhere

### 6.2 Monitoring
- Set up Stripe webhook monitoring
- Monitor Firebase usage
- Track extension analytics
- Set up error logging

### 6.3 Scaling
- Consider caching for subscription checks
- Implement database indexing
- Monitor API usage
- Set up alerts for failures

## Step 7: Testing Checklist

### Extension Testing
- [ ] Free tier works (5 checks per day)
- [ ] Usage limit is enforced
- [ ] Upgrade flow works
- [ ] Pro users get unlimited access
- [ ] Authentication persists
- [ ] Error handling works

### Website Testing
- [ ] Google sign-in works
- [ ] Stripe checkout works
- [ ] Webhook processing works
- [ ] JWT token generation works
- [ ] Extension redirect works

### Integration Testing
- [ ] End-to-end upgrade flow
- [ ] Subscription status sync
- [ ] Payment processing
- [ ] Error recovery

## Troubleshooting

### Common Issues

1. **Extension can't authenticate**
   - Check website URL in background.js
   - Verify Firebase configuration
   - Check Chrome identity permissions

2. **Stripe payments not working**
   - Verify webhook endpoint
   - Check Stripe keys
   - Test with Stripe test mode first

3. **Usage limits not working**
   - Check storage permissions
   - Verify background script is running
   - Check subscription status logic

4. **Website deployment issues**
   - Check environment variables
   - Verify Firebase configuration
   - Check Vercel deployment logs

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check Firebase console for data
4. Review Stripe dashboard for payments
5. Test with different user accounts

## Support

For issues with:
- **Extension**: Check Chrome extension documentation
- **Firebase**: Check Firebase documentation
- **Stripe**: Check Stripe documentation
- **Vercel**: Check Vercel documentation

## Cost Estimation

### Monthly Costs (approximate)
- **Firebase**: $0-25 (depending on usage)
- **Stripe**: 2.9% + 30¢ per transaction
- **Vercel**: $0-20 (depending on usage)
- **Gemini API**: $0-50 (depending on usage)

### Revenue Model
- **Free Tier**: 5 fact checks per day
- **Pro Tier**: $9.99/month for unlimited checks
- **Target**: 100+ paying users for profitability
