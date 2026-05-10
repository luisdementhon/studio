import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 });
    }

    // Créer un client Stripe s'il n'existe pas ou le récupérer
    // Pour simplifier ici, on crée un SetupIntent directement
    const setupIntent = await stripe.setupIntents.create({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
