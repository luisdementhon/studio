import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { verifyCronSecret, resolvePeriod } from '@/lib/cron-auth';
import { computeFeeAmount } from '@/lib/fees';

export const dynamic = 'force-dynamic';
// Le job itère sur tous les donateurs : il lui faut plus que les 10s par défaut.
export const maxDuration = 300;

/** Au-delà, un verrou « running » est considéré comme orphelin. */
const RUN_STALE_AFTER_MS = 60 * 60 * 1000;

interface RoundupDoc {
  id: string;
  amount: number;
  associationId: string;
}

/**
 * Règlement mensuel des arrondis.
 *
 * Pour chaque donateur : on additionne ses arrondis `pending` du mois, on
 * les groupe par association, on applique le plafond du mandat, puis on
 * déclenche un prélèvement `off_session` par couple (donateur, association).
 *
 * Ce job ne fait QUE créer les PaymentIntents. C'est le webhook
 * `payment_intent.succeeded` qui solde les arrondis et crée les versements :
 * tant que Stripe n'a pas confirmé, rien n'est marqué comme versé.
 *
 * Appelé par Cloud Scheduler, authentifié par CRON_SECRET.
 */
export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, start, end } = resolvePeriod(url.searchParams.get('period'));

  // Verrou de période : un second appel sur le même mois ne re-prélève pas.
  const runRef = db.collection('settlement_runs').doc(period);
  const claimed = await db.runTransaction(async (tx) => {
    const existing = await tx.get(runRef);

    if (existing.exists) {
      const data = existing.data();

      // Période déjà réglée : on ne rejoue pas.
      if (data?.status === 'completed') return false;

      // Verrou « running » orphelin : si le job a été tué (dépassement de
      // maxDuration, OOM, éviction), aucun catch n'a pu le libérer et le mois
      // ne serait JAMAIS réglé, chaque relance répondant « already_settled ».
      // Passé ce délai, on reprend — c'est sans risque, la requête ne
      // reprend que les arrondis restés `pending`.
      const startedAt = data?.startedAt?.toMillis?.() ?? 0;
      if (Date.now() - startedAt < RUN_STALE_AFTER_MS) return false;
    }

    tx.set(runRef, {
      period,
      status: 'running',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!claimed) {
    return NextResponse.json({ period, status: 'already_settled' });
  }

  const report = { period, usersProcessed: 0, batchesCreated: 0, batchesFailed: 0, skipped: 0 };

  try {
    const eligibleUsers = await db
      .collection('users')
      .where('stripePaymentMethodId', '!=', null)
      .get();

    for (const userDoc of eligibleUsers.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      if (!userData.stripeCustomerId || !userData.stripePaymentMethodId) {
        report.skipped++;
        continue;
      }

      const roundups = await db
        .collection('users')
        .doc(userId)
        .collection('donations')
        .where('type', '==', 'roundup')
        .where('status', '==', 'pending')
        // Pas de borne basse : une transaction datée d'un mois déjà réglé peut
        // remonter en retard (les banques ont 1 à 2 jours de délai). La borner
        // au seul mois courant la laisserait `pending` à vie, puisque la
        // période précédente est verrouillée et ne sera jamais rejouée.
        .where('transactionDate', '<', admin.firestore.Timestamp.fromDate(end))
        .get();

      if (roundups.empty) {
        report.skipped++;
        continue;
      }

      // Groupement par association bénéficiaire.
      const byAssociation = new Map<string, RoundupDoc[]>();
      for (const doc of roundups.docs) {
        const data = doc.data();
        if (!data.associationId) continue;

        // Un montant NaN ou négatif empoisonnerait tout le groupe : NaN rend
        // fausse TOUTE comparaison, donc le plafond cesserait de filtrer quoi
        // que ce soit et Stripe recevrait un montant NaN.
        const amount = Number(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          console.warn(`Arrondi ${doc.id} au montant invalide (${data.amount}) : ignoré.`);
          continue;
        }

        const list = byAssociation.get(data.associationId) ?? [];
        list.push({ id: doc.id, amount, associationId: data.associationId });
        byAssociation.set(data.associationId, list);
      }

      // Second garde-fou du plafond : le mandat signé fait foi, et il prime
      // sur une éventuelle modification ultérieure du plafond.
      const ceiling = Number(userData.mandateCeiling ?? userData.donationCeiling ?? 0);
      let remaining = ceiling > 0 ? ceiling : Number.POSITIVE_INFINITY;

      for (const [associationId, items] of byAssociation) {
        // On ne prélève que des arrondis ENTIERS, dans la limite du plafond.
        // Écrêter un montant tout en soldant la totalité des arrondis
        // marquerait comme versé de l'argent jamais encaissé : l'historique
        // du donateur ne correspondrait plus à son relevé bancaire.
        const affordable: RoundupDoc[] = [];
        let chargeable = 0;
        for (const item of items) {
          if (chargeable + item.amount > remaining) continue;
          affordable.push(item);
          chargeable = Math.round((chargeable + item.amount) * 100) / 100;
        }

        // Stripe refuse en dessous de 0,50 €. Les arrondis restent `pending`
        // et seront repris par un prochain règlement.
        if (chargeable < 0.5) continue;

        const association = await db.collection('associations').doc(associationId).get();
        const stripeAccountId = association.data()?.stripeAccountId;

        if (!stripeAccountId) {
          console.warn(`Association ${associationId} sans compte Stripe : batch ignoré.`);
          continue;
        }

        const amountInCents = Math.round(chargeable * 100);
        const batchId = `${userId}_${associationId}_${period}`;
        const batchRef = db.collection('monthly_batches').doc(batchId);

        // Le batch est écrit AVANT le paiement : le webhook doit pouvoir
        // retrouver la liste des arrondis à solder.
        await batchRef.set({
          batchId,
          userId,
          associationId,
          period,
          amount: chargeable,
          // Uniquement les arrondis réellement couverts par ce paiement.
          roundupIds: affordable.map((item) => item.id),
          status: 'processing',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        try {
          await stripe.paymentIntents.create(
            {
              amount: amountInCents,
              currency: 'eur',
              customer: userData.stripeCustomerId,
              payment_method: userData.stripePaymentMethodId,
              off_session: true,
              confirm: true,
              description: `Arrondis ${period} — ${association.data()?.associationName ?? 'association'}`,
              transfer_data: { destination: stripeAccountId },
              application_fee_amount: computeFeeAmount(amountInCents, association.data()),
              metadata: {
                type: 'roundup_batch',
                batchId,
                userId,
                associationId,
                associationName: association.data()?.associationName ?? '',
                period,
              },
            },
            // Sécurité supplémentaire côté Stripe : même si ce job était
            // relancé, le même batch ne produirait pas deux paiements.
            { idempotencyKey: batchId }
          );

          report.batchesCreated++;
          remaining = Math.round((remaining - chargeable) * 100) / 100;
        } catch (error: any) {
          report.batchesFailed++;

          await batchRef.set(
            {
              status: 'failed',
              failureCode: error?.code ?? null,
              failureReason: error?.message ?? 'Erreur inconnue',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // La carte exige une authentification forte : le mandat doit être
          // resigné par le donateur, les arrondis restent en attente.
          if (error?.code === 'authentication_required') {
            await userDoc.ref.set({ mandateNeedsReauth: true }, { merge: true });
          }

          console.error(`Échec du prélèvement ${batchId}:`, error?.message);
        }
      }

      report.usersProcessed++;
    }

    await runRef.set(
      { ...report, status: 'completed', finishedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return NextResponse.json(report);
  } catch (error: any) {
    // Le verrou est RÉELLEMENT libéré : on supprime le document, sinon toute
    // relance ressortirait en `already_settled` et les donateurs non encore
    // traités ne seraient jamais prélevés pour ce mois.
    //
    // Rejouer est sans danger : la requête ne reprend que les arrondis restés
    // `pending`, ceux déjà soldés par le webhook Stripe en sont exclus.
    await db.collection('settlement_failures').doc(`${period}_${Date.now()}`).set({
      period,
      error: error?.message ?? 'Erreur inconnue',
      partialReport: report,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await runRef.delete().catch(() => {});

    console.error('Échec du règlement mensuel:', error);
    return NextResponse.json({ error: 'Le règlement a échoué.', period }, { status: 500 });
  }
}
