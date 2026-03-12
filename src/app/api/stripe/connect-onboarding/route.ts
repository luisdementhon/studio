import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialisation de Firebase côté serveur (Route Handler)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Route API pour créer un compte Stripe Connect Express pour une association
 * et générer un lien d'onboarding.
 */
export async function POST(request: Request) {
  try {
    const { associationId } = await request.json();

    if (!associationId) {
      return NextResponse.json({ error: 'associationId est requis.' }, { status: 400 });
    }

    // 1. Création du compte Stripe Connect Express
    // On demande les capacités 'card_payments' et 'transfers' pour permettre la réception de fonds
    const account = await stripe.accounts.create({
      country: 'FR',
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 2. Mise à jour du document de l'association dans Firestore
    const associationRef = doc(db, 'associations', associationId);
    await updateDoc(associationRef, {
      stripeAccountId: account.id,
    });

    // 3. Génération du lien d'onboarding Stripe
    // Stripe nécessite des URLs absolues
    const origin = request.headers.get('origin') || 'http://localhost:9002';
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard/association`,
      return_url: `${origin}/dashboard/association`,
      type: 'account_onboarding',
    });

    // 4. Renvoi de l'URL d'onboarding au frontend
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error("Stripe Connect Onboarding Error:", error);
    return NextResponse.json({ 
      error: error.message || 'Une erreur interne est survenue lors de la création du compte Stripe.' 
    }, { status: 500 });
  }
}
