import Stripe from 'stripe';

// Stripe keys are read from environment variables for security.
// For development/demo purposes, fallback values are provided directly.
// In a production environment, these MUST be set as environment variables.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RsLWg2cs2Ko36FfC6lRnNDb3smV0d7qXE964cEqJw98yMpPmw3h3EK1BB0ssQZ9BlqMxvUSONcbBK79xxSKk9at00ZCSuOUvh';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RsLWg2cs2Ko36FftJwT81VPAZxncV7yeemplfpB720nRZX7BCYqGV4WPTDNhoEXmk3MAP8k8mHshIJUoIHlndT1002U0hYvwk';
