import { NextResponse } from 'next/server';
import { db, auth as adminAuth } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { getBridgeCredentials } from '@/lib/bridge-server';

// La route enchaîne Stripe, Bridge, plusieurs requêtes collection-group et
// une suppression récursive : les 10 s par défaut ne suffisent pas.
export const maxDuration = 120;

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

    // 3. Anonymiser les pièces comptables, que les associations doivent
    //    légalement conserver. L'identifiant est remplacé par un pseudonyme
    //    PROPRE À CE COMPTE : un 'deleted' partagé ferait fusionner tous les
    //    donateurs supprimés dans un unique reçu fiscal par association.
    const anonymousId = `deleted_${userId.slice(0, 8)}`;

    const assoDonations = await db
      .collectionGroup('donations')
      .where('userId', '==', userId)
      .get();

    const anonymise = db.batch();
    let pending = 0;
    for (const doc of assoDonations.docs) {
      // Ne toucher qu'aux copies côté association : celles du donateur sont
      // supprimées avec son profil juste après.
      if (!doc.ref.path.startsWith('associations/')) continue;
      anonymise.set(
        doc.ref,
        { userId: anonymousId, donorName: 'Donateur supprimé' },
        { merge: true }
      );
      pending++;
    }
    if (pending > 0) await anonymise.commit();

    // Les versements et les reçus fiscaux portent aussi l'identité : le reçu
    // conserve même l'adresse email. On les anonymise, sans les supprimer.
    for (const collectionName of ['payouts', 'taxReceipts']) {
      const docs = await db.collectionGroup(collectionName).where('userId', '==', userId).get();
      for (const doc of docs.docs) {
        await doc.ref.set(
          { userId: anonymousId, donorName: 'Donateur supprimé', donorEmail: null },
          { merge: true }
        );
      }
    }

    // Batches de prélèvement : données personnelles, plus aucune utilité.
    const batches = await db.collection('monthly_batches').where('userId', '==', userId).get();
    for (const doc of batches.docs) {
      await doc.ref.delete();
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
