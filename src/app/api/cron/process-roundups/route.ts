import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db, admin } from '@/lib/firebase-admin';

// Forcer Next.js à traiter cette route de manière dynamique
export const dynamic = 'force-dynamic';

/**
 * Route Cron pour traiter les prélèvements d'arrondis mensuels.
 * Cette API peut être appelée par Google Cloud Scheduler ou un service de cron.
 */
export async function POST(request: Request) {
  // Sécuriser l'accès avec un CRON_SECRET si configuré
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    // 1. Récupérer tous les utilisateurs avec un moyen de paiement lié
    const usersSnap = await db.collection('users')
      .where('paymentMethodLinked', '==', true)
      .get();

    if (usersSnap.empty) {
      return NextResponse.json({ message: 'Aucun utilisateur avec carte bancaire configurée.' });
    }

    console.log(`MOTEUR : Traitement en cours de ${usersSnap.size} utilisateurs...`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const { stripeCustomerId, stripePaymentMethodId, associations = [], firstName, lastName } = userData;

      // S'assurer qu'on a bien les infos Stripe requises pour le prélèvement off-session
      if (!stripeCustomerId || !stripePaymentMethodId) {
        console.warn(`MOTEUR WARNING : Utilisateur ${userId} a paymentMethodLinked=true mais des identifiants Stripe manquants.`);
        continue;
      }

      try {
        // 2. Récupérer tous les arrondis "pending" de cet utilisateur
        const donationsSnap = await db.collection('users').doc(userId).collection('donations')
          .where('status', '==', 'pending')
          .where('type', '==', 'roundup')
          .get();

        if (donationsSnap.empty) {
          console.log(`MOTEUR : Utilisateur ${userId} n'a aucun arrondi en attente.`);
          continue;
        }

        // 3. Calculer le total accumulé
        let totalAmount = 0;
        donationsSnap.forEach(d => {
          totalAmount += d.data().amount || 0;
        });
        totalAmount = Math.round(totalAmount * 100) / 100;

        // Stripe impose un montant minimum de 0.50 EUR pour tout prélèvement
        if (totalAmount < 0.50) {
          console.log(`MOTEUR : Arrondis de l'utilisateur ${userId} (${totalAmount}€) en dessous du minimum Stripe de 0.50€. Report au prochain cycle.`);
          continue;
        }

        // 4. Récupérer les associations actives soutenues par cet utilisateur
        const activeAssos: any[] = [];
        for (const assoId of associations) {
          const assoSnap = await db.collection('associations').doc(assoId).get();
          if (assoSnap.exists) {
            const assoData = assoSnap.data() || {};
            if (assoData.stripeAccountId) {
              activeAssos.push({
                id: assoId,
                stripeAccountId: assoData.stripeAccountId,
                associationName: assoData.associationName,
              });
            }
          }
        }

        if (activeAssos.length === 0) {
          console.warn(`MOTEUR WARNING : L'utilisateur ${userId} n'a aucune association avec un compte Stripe Connect valide. Prélèvement annulé.`);
          continue;
        }

        console.log(`MOTEUR : Tentative de prélèvement de ${totalAmount}€ pour l'utilisateur ${userId} (${activeAssos.length} assos soutenues)`);

        // 5. Déclencher le prélèvement Stripe (Off-Session)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // En centimes
          currency: 'eur',
          customer: stripeCustomerId,
          payment_method: stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Dotly - Prélèvement d'arrondis cumulés (${totalAmount} €)`,
        });

        if (paymentIntent.status === 'succeeded') {
          console.log(`MOTEUR SUCCESS : Prélèvement réussi de ${totalAmount}€ pour l'utilisateur ${userId}`);

          // 6. Mettre à jour le statut des arrondis en "succeeded"
          const batch = db.batch();
          donationsSnap.docs.forEach(doc => {
            batch.update(doc.ref, { 
              status: 'succeeded', 
              paidAt: new Date().toISOString(),
              stripePaymentIntentId: paymentIntent.id 
            });
          });
          await batch.commit();

          // 7. Diviser et transférer les fonds aux associations (Stripe Connect Transfers)
          const splitAmount = Math.round((totalAmount / activeAssos.length) * 100) / 100;

          for (const asso of activeAssos) {
            try {
              // Créer le transfert Stripe vers le compte de l'association
              const transfer = await stripe.transfers.create({
                amount: Math.round(splitAmount * 100),
                currency: 'eur',
                destination: asso.stripeAccountId,
                description: `Arrondis reversés par ${firstName || ''} ${lastName || ''} via Dotly`,
              });

              console.log(`MOTEUR TRANSFER : ${splitAmount}€ transférés vers l'association ${asso.associationName} (${asso.id})`);

              // Enregistrer l'écriture de don côté association
              const donationId = `transfer_${transfer.id}`;
              await db.collection('associations').doc(asso.id).collection('donations').doc(donationId).set({
                id: donationId,
                userId: userId,
                amount: splitAmount,
                transactionDate: new Date().toISOString(),
                stripeTransferId: transfer.id,
                status: 'succeeded',
                donorName: `${firstName || ''} ${lastName || ''}`.trim() || 'Donateur Anonyme',
              });

            } catch (transferError: any) {
              console.error(`MOTEUR TRANSFER ERROR : Échec du transfert vers l'association ${asso.id}:`, transferError);
              // Noter l'échec du transfert mais continuer pour les autres associations
            }
          }

          successCount++;
          results.push({ userId, status: 'success', amount: totalAmount });
        } else {
          throw new Error(`Statut Stripe inattendu : ${paymentIntent.status}`);
        }

      } catch (userError: any) {
        console.error(`MOTEUR ERROR : Échec du traitement pour l'utilisateur ${userId}:`, userError);
        errorCount++;
        
        // En cas d'échec de prélèvement (ex: carte refusée, expirée) :
        // 1. Marquer les dons comme "failed" pour qu'on ne tente pas de les reprélèvements indéfiniment
        const batch = db.batch();
        const donationsSnap = await db.collection('users').doc(userId).collection('donations')
          .where('status', '==', 'pending')
          .where('type', '==', 'roundup')
          .get();
        donationsSnap.docs.forEach(doc => {
          batch.update(doc.ref, { status: 'failed', lastError: userError.message || 'Paiement refusé' });
        });
        await batch.commit();

        // 2. Alerter l'utilisateur en désactivant son moyen de paiement dans Firestore
        await db.collection('users').doc(userId).update({
          paymentMethodLinked: false,
          paymentMethodError: userError.message || 'Paiement refusé',
          updatedAt: new Date().toISOString()
        });

        results.push({ userId, status: 'failed', error: userError.message });
      }
    }

    return NextResponse.json({
      message: 'Traitement des arrondis terminé.',
      summary: {
        totalProcessed: successCount + errorCount,
        success: successCount,
        errors: errorCount
      },
      details: results
    });

  } catch (error: any) {
    console.error("MOTEUR CRITICAL ERROR :", error);
    return NextResponse.json({ error: 'Une erreur critique est survenue dans le moteur.', details: error.message }, { status: 500 });
  }
}
