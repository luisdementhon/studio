import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';

/**
 * Route API pour créer un compte Stripe Connect Express pour une association
 * et générer un lien d'onboarding.
 * Note: L'enregistrement du stripeAccountId dans Firestore doit être fait côté client
 * pour respecter les règles de sécurité.
 */
export async function POST(request: Request) {
  try {
    // Le compte de l'association est toujours celui de l'appelant authentifié :
    // le doc Firestore d'une association a pour id l'UID de son compte.
    const decoded = await requireUser(request);
    const associationId = decoded.uid;

    // 1. Création du compte Stripe Connect Express
    const account = await stripe.accounts.create({
      country: 'FR',
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 2. Génération du lien d'onboarding Stripe
    const origin = request.headers.get('origin') || 'http://localhost:9002';
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard/association`,
      return_url: `${origin}/dashboard/association`,
      type: 'account_onboarding',
    });

    // 3. Renvoi de l'ID du compte et de l'URL au frontend
    return NextResponse.json({ 
      url: accountLink.url,
      stripeAccountId: account.id 
    });

  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Stripe Connect Onboarding Error:", error);
    return NextResponse.json({ 
      error: error.message || 'Une erreur interne est survenue lors de la création du compte Stripe.' 
    }, { status: 500 });
  }
}