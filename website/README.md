# Fact Checker Extension Website

This is the website for the Fact Checker Extension that handles user authentication and subscription management.

## Features

- Firebase Authentication with Google Sign-in
- Stripe payment processing for Pro subscriptions
- JWT token generation for extension authentication
- Webhook handling for subscription updates

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env.local
```

3. Configure the following environment variables in `.env.local`:

### Firebase Configuration
- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `FIREBASE_APP_ID`: Your Firebase app ID

### Stripe Configuration
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### JWT Configuration
- `JWT_SECRET`: A secret key for JWT token generation

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Set up the following Firestore rules:

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

## Stripe Setup

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up a webhook endpoint pointing to `/api/webhook`
4. Configure the webhook to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Development

```bash
npm run dev
```

## Deployment

This project is designed to be deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Set up the environment variables in Vercel dashboard
3. Deploy

## API Endpoints

- `GET /` - Main landing page
- `POST /api/check-subscription` - Check user subscription status
- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/verify-token` - Verify JWT token from extension
- `POST /api/webhook` - Stripe webhook handler
- `POST /api/verify-session` - Verify successful payment

## Extension Integration

The website integrates with the Chrome extension through:

1. Chrome Identity API for authentication flow
2. JWT tokens for secure communication
3. Redirect URLs for seamless user experience

The extension should be configured with the website URL in the `authenticateUser` function in `background.js`.
