import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Initialize Stripe on the client side
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Initialize Stripe on the server side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export default stripe;
