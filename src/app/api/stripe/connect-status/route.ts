import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/firebase-admin';

/**
 * Rafraîchit l'état réel du compte Stripe Connect de l'association.
 *
 * Posséder un `stripeAccountId` ne signifie pas pouvoir encaisser : le compte
 * est créé dès le premier clic, avant que l'association n'ait rempli le
 * formulaire Stripe. Sans ce contrôle, une association qui abandonne
 * l'onboarding en cours de route voit son alerte disparaître et perd tous ses
 * dons en silence.
 *
 * Ce sont `charges_enabled` et `payouts_enabled` qui font foi.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const associationRef = db.collection('associations').doc(decoded.uid);
    const stripeAccountId = (await associationRef.get()).data()?.stripeAccountId;

    if (!stripeAccountId) {
      return NextResponse.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    const status = {
      stripeChargesEnabled: Boolean(account.charges_enabled),
      stripePayoutsEnabled: Boolean(account.payouts_enabled),
      stripeDetailsSubmitted: Boolean(account.details_submitted),
      stripeStatusCheckedAt: new Date(),
    };

    await associationRef.set(status, { merge: true });

    return NextResponse.json({
      connected: true,
      chargesEnabled: status.stripeChargesEnabled,
      payoutsEnabled: status.stripePayoutsEnabled,
      detailsSubmitted: status.stripeDetailsSubmitted,
    });
  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    // Compte supprimé côté Stripe, ou API indisponible : on considère que
    // l'association ne peut pas encaisser, ce qui est le repli prudent.
    console.error('Vérification du compte Stripe impossible:', error?.message);
    return NextResponse.json(
      { connected: false, chargesEnabled: false, payoutsEnabled: false },
      { status: 200 }
    );
  }
}
