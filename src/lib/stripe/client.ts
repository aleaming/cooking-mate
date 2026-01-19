import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing NEXT_STRIPE_PUBLISHABLE_KEY environment variable');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
