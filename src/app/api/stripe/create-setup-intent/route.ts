import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    // 1. Récupérer l'utilisateur dans Firestore via Admin SDK
    const userDocRef = db.collection('users').doc(userId);
    const userSnap = await userDocRef.get();
    
    let stripeCustomerId = '';
    
    if (userSnap.exists) {
      stripeCustomerId = userSnap.data()?.stripeCustomerId || '';
    }

    // 2. Créer un client Stripe si non existant
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;
      
      // Sauvegarder dans Firestore
      await userDocRef.set({ stripeCustomerId }, { merge: true });
    }

    // 3. Créer le SetupIntent avec le customer ID
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        userId: userId,
      },
      usage: 'off_session', // Indispensable pour prélever plus tard sans que l'utilisateur soit là
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe SetupIntent Error:', error);
    return NextResponse.json({ error: error.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
