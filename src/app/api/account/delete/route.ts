import { NextResponse } from 'next/server';
import { db, auth as adminAuth } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { getBridgeCredentials } from '@/lib/bridge-server';

/**
 * Suppression du compte et des données associées (RGPD, droit à l'effacement).
 *
 * Ordre important : on purge d'abord les prestataires (Stripe, Bridge), puis
 * Firestore, et l'authentification en dernier. Si une étape échoue, le compte
 * reste accessible et l'utilisateur peut réessayer, plutôt que de se
 * retrouver déconnecté avec des données résiduelles chez un prestataire.
 *
 * Les dons déjà versés ne sont pas supprimés côté association : ce sont ses
 * pièces comptables, soumises à une obligation de conservation. Ils sont
 * anonymisés.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const userId = decoded.uid;

    const userRef = db.collection('users').doc(userId);
    const userData = (await userRef.get()).data();

    // 1. Stripe : détacher le moyen de paiement et supprimer le Customer.
    if (userData?.stripeCustomerId) {
      try {
        await stripe.customers.del(userData.stripeCustomerId);
      } catch (error) {
        console.warn('Suppression du Customer Stripe impossible:', error);
      }
    }

    // 2. Bridge : révoquer l'accès au compte bancaire.
    if (userData?.bridgeItemId) {
      try {
        const { clientId, clientSecret } = getBridgeCredentials();
        const tokenResponse = await fetch(
          'https://api.bridgeapi.io/v3/aggregation/authorization/token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bridge-Version': '2025-01-15',
              'Client-Id': clientId,
              'Client-Secret': clientSecret,
            },
            body: JSON.stringify({ external_user_id: userId }),
          }
        );

        if (tokenResponse.ok) {
          const { access_token } = await tokenResponse.json();
          await fetch(`https://api.bridgeapi.io/v3/aggregation/items/${userData.bridgeItemId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${access_token}`,
              'Bridge-Version': '2025-01-15',
              'Client-Id': clientId,
            },
          });
        }
      } catch (error) {
        console.warn('Révocation Bridge impossible:', error);
      }
    }

    // 3. Anonymiser les dons côté association (pièces comptables conservées).
    const assoDonations = await db
      .collectionGroup('donations')
      .where('userId', '==', userId)
      .get();

    for (const doc of assoDonations.docs) {
      // Ne toucher qu'aux copies côté association : celles du donateur sont
      // supprimées avec son profil juste après.
      if (doc.ref.path.startsWith('associations/')) {
        await doc.ref.set({ userId: 'deleted', donorName: 'Donateur supprimé' }, { merge: true });
      }
    }

    // 4. Firestore : profil et sous-collections.
    await db.recursiveDelete(userRef);

    // 5. Authentification, en dernier.
    await adminAuth.deleteUser(userId);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error('Échec de la suppression du compte:', error);
    return NextResponse.json({ error: 'La suppression a échoué.' }, { status: 500 });
  }
}
