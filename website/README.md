# Fact Checker Pro Website

This is the website component for the Social Media Fact Checker extension, providing user authentication, subscription management, and payment processing.

## Features

- User registration and authentication using Firebase
- Subscription management with Stripe integration
- Free tier with 5 fact checks per day
- Pro tier with unlimited fact checks
- Responsive design similar to vidow.io

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the website directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Extension API Key (for extension to authenticate)
EXTENSION_API_KEY=your_extension_api_secret
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Generate a service account key for server-side operations
5. Add your domain to Firebase Auth authorized domains

### 3. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create products and prices for your subscription plans
3. Set up webhooks pointing to `https://your-domain.com/api/webhook/stripe`
4. Update the price IDs in `/src/app/api/create-checkout-session/route.ts`

### 4. Installation

```bash
cd website
npm install
npm run dev
```

### 5. Deployment to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the website directory
3. Configure environment variables in Vercel dashboard
4. Update extension URLs to point to your deployed domain

## API Endpoints

- `GET /api/me/limits` - Get user's fact check limits
- `POST /api/me/limits` - Update user's fact check usage
- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/webhook/stripe` - Handle Stripe webhooks

## Extension Integration

The extension communicates with this website through:

1. User authentication (stored in extension's local storage)
2. API calls to check limits before fact checking
3. Usage tracking and subscription status

Update the following URLs in your extension files:
- `background.js` - API endpoint URLs
- `popup.js` - Website URLs for authentication and pricing

## Security Notes

- Use environment variables for all sensitive data
- Implement proper API key validation
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting for API endpoints

## Support

For issues or questions, please refer to the main extension documentation.