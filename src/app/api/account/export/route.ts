import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';

/**
 * Export des données personnelles (RGPD, droit d'accès et portabilité).
 *
 * Renvoie l'intégralité des données détenues sur le donateur, dans un format
 * lisible et réutilisable.
 */
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    const userId = decoded.uid;

    const userRef = db.collection('users').doc(userId);
    const [profile, donations, failures, batches] = await Promise.all([
      userRef.get(),
      userRef.collection('donations').get(),
      userRef.collection('payment_failures').get(),
      db.collection('monthly_batches').where('userId', '==', userId).get(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { id: userId, ...profile.data() },
      donations: donations.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      paymentFailures: failures.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      monthlyBatches: batches.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dotly-donnees-${userId}.json"`,
      },
    });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Échec de l'export des données:", error);
    return NextResponse.json({ error: "L'export a échoué." }, { status: 500 });
  }
}
