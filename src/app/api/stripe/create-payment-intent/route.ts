import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { amount, associationId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
    }

    if (!associationId) {
      return NextResponse.json({ error: 'associationId est requis.' }, { status: 400 });
    }

    // 1. Récupération du document de l'association dans Firestore via Admin SDK
    const associationSnap = await db.collection('associations').doc(associationId).get();

    if (!associationSnap.exists) {
      return NextResponse.json({ error: 'Association non trouvée.' }, { status: 404 });
    }

    const associationData = associationSnap.data() || {};
    const stripeAccountId = associationData.stripeAccountId;

    // 2. Vérification de la présence du compte Stripe lié
    if (!stripeAccountId) {
      return NextResponse.json({ 
        error: "Cette association n'a pas encore configuré son compte de paiement (Stripe Connect)." 
      }, { status: 400 });
    }

    // 3. Création du PaymentIntent avec transfert vers le compte de destination
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      description: `Don à ${associationData.associationName || 'une association'} via Dotly`,
      transfer_data: {
        destination: stripeAccountId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      stripeAccountId: stripeAccountId 
    });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
