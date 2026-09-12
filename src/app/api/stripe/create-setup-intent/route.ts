import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/firebase-admin';

/**
 * Prépare la signature du mandat : crée (ou réutilise) le Customer Stripe du
 * donateur, puis un SetupIntent rattaché à ce Customer.
 *
 * Le Customer est indispensable : c'est lui qui permettra les débits
 * mensuels `off_session` sous le mandat, une fois la carte enregistrée.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const userId = decoded.uid;

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    let customerId: string | undefined = userData?.stripeCustomerId;

    // Vérifier que le Customer mémorisé existe toujours côté Stripe : une
    // bascule de compte (test -> live, ou rotation de clés) le rendrait
    // introuvable, et tous les prélèvements échoueraient silencieusement.
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as { deleted?: boolean }).deleted) customerId = undefined;
      } catch {
        customerId = undefined;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: decoded.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      // Indispensable pour prélever plus tard sans que l'utilisateur soit là
      usage: 'off_session',
      metadata: {
        userId,
        // Plafond au moment de la signature : c'est la borne du mandat.
        mandateCeiling: String(userData?.donationCeiling ?? 50),
      },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error('Stripe SetupIntent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
