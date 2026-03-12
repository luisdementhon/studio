import Stripe from 'stripe';

// Les clés Stripe sont lues depuis les variables d'environnement pour la sécurité.
// En production, ces variables doivent être configurées dans votre interface d'hébergement.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn("Attention: STRIPE_SECRET_KEY manquante en production.");
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
