import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialisation de Firebase côté serveur (Route Handler)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Route API pour créer un PaymentIntent Stripe avec transfert vers une association.
 * Reçoit { amount, associationId } en JSON.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const userId = decoded.uid;

    const body = await request.json();
    const { amount, associationId } = body;

    // Validation basique des entrées
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
    }

    if (!associationId) {
      return NextResponse.json({ error: 'associationId est requis.' }, { status: 400 });
    }

    // 1. Récupération du document de l'association dans Firestore
    const associationRef = doc(db, 'associations', associationId);
    const associationSnap = await getDoc(associationRef);

    if (!associationSnap.exists()) {
      return NextResponse.json({ error: 'Association non trouvée.' }, { status: 404 });
    }

    const associationData = associationSnap.data();
    const stripeAccountId = associationData.stripeAccountId;

    // 2. Vérification de la présence du compte Stripe lié
    if (!stripeAccountId) {
      return NextResponse.json({ 
        error: "Cette association n'a pas encore configuré son compte de paiement (Stripe Connect)." 
      }, { status: 400 });
    }

    // 3. Création du PaymentIntent avec transfert vers le compte de destination
    // Le montant est multiplié par 100 pour être converti en centimes
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
      metadata: {
        userId,
        associationId,
        associationName: associationData.associationName || '',
        type: 'one-time',
      },
    });

    // 4. Renvoi du client_secret au front-end pour finaliser le paiement
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      stripeAccountId: stripeAccountId 
    });

  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Stripe PaymentIntent Error:", error);
    return NextResponse.json({ error: error.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
