import Stripe from 'stripe';

// IMPORTANT: Move this to a .env.local file for production
const STRIPE_SECRET_KEY = 'sk_test_51RsLWg2cs2Ko36FfC6lRnNDb3smV0d7qXE964cEqJw98yMpPmw3h3EK1BB0ssQZ9BlqMxvUSONcbBK79xxSKk9at00ZCSuOUvh';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// IMPORTANT: Move this to a .env.local file for production and name it NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RsLWg2cs2Ko36FftJwT81VPAZxncV7yeemplfpB720nRZX7BCYqGV4WPTDNhoEXmk3MAP8k8mHshIJUoIHlndT1002U0hYvwk';
