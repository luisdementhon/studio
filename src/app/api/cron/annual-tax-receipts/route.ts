import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { verifyCronSecret } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Génère les reçus fiscaux annuels, cumulés par donateur et par association.
 *
 * Le reçu Dotly est annuel et cumulé — jamais un reçu par don : c'est ce que
 * promet la landing, et c'est ce qui correspond au régime des dons aux
 * associations (articles 200 / 238 bis du CGI).
 *
 * Appelé par Cloud Scheduler en début d'année civile, authentifié par
 * CRON_SECRET. `?year=2026` permet de régénérer une année donnée.
 */
export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('year'));
  const year = Number.isInteger(requested) ? requested : new Date().getFullYear() - 1;

  const start = admin.firestore.Timestamp.fromDate(new Date(year, 0, 1));
  const end = admin.firestore.Timestamp.fromDate(new Date(year + 1, 0, 1));

  const report = { year, receiptsWritten: 0, associationsCovered: 0 };

  try {
    const associations = await db.collection('associations').get();

    for (const association of associations.docs) {
      // Les dons versés de l'année, côté association.
      const donations = await association.ref
        .collection('donations')
        .where('status', '==', 'succeeded')
        .where('transactionDate', '>=', start)
        .where('transactionDate', '<', end)
        .get();

      if (donations.empty) continue;

      // Cumul par donateur.
      const totals = new Map<string, number>();
      for (const doc of donations.docs) {
        const data = doc.data();
        if (!data.userId) continue;
        totals.set(data.userId, (totals.get(data.userId) ?? 0) + Number(data.amount || 0));
      }

      for (const [userId, totalAmount] of totals) {
        const userSnap = await db.collection('users').doc(userId).get();
        const userData = userSnap.data();

        const donorName =
          [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || 'Donateur Anonyme';

        // Id déterministe : régénérer une année met à jour sans dupliquer.
        await association.ref
          .collection('taxReceipts')
          .doc(`${userId}_${year}`)
          .set(
            {
              // `year` doit être numérique : la page trie dessus, un doc sans
              // ce champ serait invisible.
              year,
              userId,
              donorName,
              donorEmail: userData?.email ?? null,
              totalAmount: Math.round(totalAmount * 100) / 100,
              status: 'generated',
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        report.receiptsWritten++;
      }

      report.associationsCovered++;
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Échec de la génération des reçus fiscaux:', error);
    return NextResponse.json({ error: 'La génération a échoué.', year }, { status: 500 });
  }
}
