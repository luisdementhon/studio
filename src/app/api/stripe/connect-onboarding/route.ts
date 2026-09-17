import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { db } from '@/lib/firebase-admin';

/**
 * Route API pour créer un compte Stripe Connect Express pour une association
 * et générer un lien d'onboarding.
 *
 * Le stripeAccountId est écrit ici, côté serveur : le doc association est en
 * écriture serveur uniquement, et c'est ce compte qui reçoit les fonds.
 */
export async function POST(request: Request) {
  try {
    // Le compte de l'association est toujours celui de l'appelant authentifié :
    // le doc Firestore d'une association a pour id l'UID de son compte.
    const decoded = await requireUser(request);
    const associationId = decoded.uid;

    const associationRef = db.collection('associations').doc(associationId);
    const associationSnap = await associationRef.get();

    // Sans profil enregistré, le `set(..., { merge: true })` plus bas CRÉAIT
    // la fiche : une association réduite à ses seuls champs Stripe, sans nom.
    // Elle remontait ensuite dans la liste des bénéficiaires côté donateur, où
    // son nom manquant faisait planter tout le tableau de bord.
    //
    // Refuser ici est aussi la règle métier : un compte qui encaisse des dons
    // doit d'abord avoir passé la vérification RNA de /api/association/register.
    if (!associationSnap.exists) {
      return NextResponse.json(
        { error: "Enregistrez d'abord le profil de votre association." },
        { status: 409 }
      );
    }

    const existingAccountId = associationSnap.data()?.stripeAccountId;

    // 1. Création du compte Stripe Connect Express — ou réutilisation, si
    // l'association avait abandonné l'onboarding en cours de route.
    const account = existingAccountId
      ? await stripe.accounts.retrieve(existingAccountId)
      : await stripe.accounts.create({
          country: 'FR',
          type: 'express',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { associationId },
        });

    if (!existingAccountId) {
      await associationRef.set({ stripeAccountId: account.id }, { merge: true });
    }

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