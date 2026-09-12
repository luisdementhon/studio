import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db, admin } from '@/lib/firebase-admin';
import {
  sendMandateConfirmedEmail,
  sendMonthlyRecapEmail,
  sendPaymentFailedEmail,
} from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing — Stripe needs the raw body for signature verification
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Stripe re-livre les events en cas de timeout ou d'erreur : sans ce garde,
  // un même paiement serait comptabilisé plusieurs fois.
  const alreadyHandled = await claimEvent(event);
  if (alreadyHandled) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'setup_intent.succeeded': {
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling event ${event.type}:`, error);
    // On libère le verrou : l'event doit pouvoir être rejoué par Stripe.
    await db.collection('stripe_events').doc(event.id).delete().catch(() => {});
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Pose un verrou d'idempotence sur l'event.
 *
 * La création du document est faite en transaction : si deux livraisons du
 * même event arrivent en parallèle, une seule obtient le verrou.
 *
 * @returns true si l'event a déjà été traité (il faut sortir).
 */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  const eventRef = db.collection('stripe_events').doc(event.id);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(eventRef);
    if (existing.exists) return true;

    tx.set(eventRef, {
      type: event.type,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return false;
  });
}

/**
 * Mandat signé : on enregistre la preuve côté serveur.
 *
 * C'est ce document qui atteste qu'un donateur a autorisé les prélèvements,
 * à quelle date et sous quel plafond. Le client ne peut pas l'écrire.
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  const userId = setupIntent.metadata?.userId;
  if (!userId) {
    console.warn('SetupIntent succeeded sans userId en metadata:', setupIntent.id);
    return;
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    console.warn('SetupIntent succeeded sans payment_method:', setupIntent.id);
    return;
  }

  // Les vraies informations de carte, au lieu des valeurs codées en dur
  // qu'écrivait le client.
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  await db.collection('users').doc(userId).set(
    {
      paymentMethodLinked: true,
      stripeSetupIntentId: setupIntent.id,
      stripePaymentMethodId: paymentMethodId,
      cardBrand: paymentMethod.card?.brand ?? null,
      cardLast4: paymentMethod.card?.last4 ?? null,
      mandateSignedAt: admin.firestore.FieldValue.serverTimestamp(),
      mandateCeiling: Number(setupIntent.metadata?.mandateCeiling ?? 0) || null,
      mandateNeedsReauth: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ Mandat enregistré pour ${userId} (${paymentMethod.card?.brand} ••••${paymentMethod.card?.last4})`);

  const userSnap = await db.collection('users').doc(userId).get();
  const email = userSnap.data()?.email;
  if (email) {
    await sendMandateConfirmedEmail(
      email,
      Number(setupIntent.metadata?.mandateCeiling ?? 0),
      paymentMethod.card?.last4
    );
  }
}

/**
 * Écrit le versement correspondant à un paiement, côté association.
 *
 * Montant NET : ce que l'association touche réellement, une fois la
 * commission retenue par Stripe. Le brut et la commission sont conservés
 * séparément pour que l'association puisse rapprocher ses comptes.
 */
async function writePayout(
  assoRef: FirebaseFirestore.DocumentReference,
  paymentIntent: Stripe.PaymentIntent,
  params: { amount: number; userId: string; period: string }
) {
  const feeAmount = (paymentIntent.application_fee_amount ?? 0) / 100;

  await assoRef
    .collection('payouts')
    .doc(paymentIntent.id)
    .set({
      date: admin.firestore.FieldValue.serverTimestamp(),
      amount: Math.round((params.amount - feeAmount) * 100) / 100,
      grossAmount: params.amount,
      feeAmount,
      status: 'completed',
      reference: `PAY-${params.period || new Date().getFullYear()}-${paymentIntent.id
        .slice(-6)
        .toUpperCase()}`,
      userId: params.userId,
      period: params.period,
    });
}

/**
 * Handle successful payment — record the donation in Firestore
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.userId || !metadata?.associationId) {
    console.warn('Payment succeeded but missing userId or associationId in metadata:', paymentIntent.id);
    return;
  }

  const amount = paymentIntent.amount / 100;
  const assoRef = db.collection('associations').doc(metadata.associationId);

  const donationData = {
    stripePaymentIntentId: paymentIntent.id,
    amount,
    currency: paymentIntent.currency,
    status: 'succeeded',
    userId: metadata.userId,
    associationId: metadata.associationId,
    associationName: metadata.associationName || '',
    type: metadata.type || 'one-time', // 'one-time' | 'roundup_batch'
    transactionDate: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (metadata.type === 'roundup_batch') {
    // Les arrondis individuels existent déjà côté donateur : en créer un de
    // plus ferait doublon dans son historique. On les solde à la place.
    await settleRoundupBatch(paymentIntent, metadata, donationData, assoRef);
  } else {
    await db
      .collection('users')
      .doc(metadata.userId)
      .collection('donations')
      .doc(paymentIntent.id)
      .set(donationData);

    // Un don ponctuel est lui aussi transféré à l'association par Stripe :
    // il doit donc apparaître dans ses versements. Sans cela, une association
    // ne recevant que des dons ponctuels voyait « Aucun versement » et un
    // total à 0 €, alors que l'argent était bien arrivé.
    await writePayout(assoRef, paymentIntent, {
      amount,
      userId: metadata.userId,
      period: '',
    });
  }

  // Miroir côté association (lu par les dashboards association)
  await assoRef.collection('donations').doc(paymentIntent.id).set(donationData);

  // Incrément atomique : un read-then-write double-comptait en cas de
  // livraisons concurrentes.
  await assoRef.set(
    {
      totalReceived: admin.firestore.FieldValue.increment(amount),
      lastDonationDate: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`✅ Donation recorded: ${amount}€ from ${metadata.userId} to ${metadata.associationId}`);
}

/**
 * Solde un batch d'arrondis : marque les arrondis concernés comme versés et
 * crée le versement correspondant pour l'association.
 */
async function settleRoundupBatch(
  paymentIntent: Stripe.PaymentIntent,
  metadata: Stripe.Metadata,
  donationData: Record<string, unknown>,
  assoRef: FirebaseFirestore.DocumentReference
) {
  const batchId = metadata.batchId;
  if (!batchId) {
    console.warn('roundup_batch sans batchId:', paymentIntent.id);
    return;
  }

  const batchRef = db.collection('monthly_batches').doc(batchId);
  const batchSnap = await batchRef.get();
  const roundupIds: string[] = batchSnap.data()?.roundupIds ?? [];

  const donationsRef = db.collection('users').doc(metadata.userId!).collection('donations');

  // Firestore limite un batch d'écritures à 500 opérations.
  for (let i = 0; i < roundupIds.length; i += 400) {
    const chunk = roundupIds.slice(i, i + 400);
    const writer = db.batch();
    for (const id of chunk) {
      writer.set(
        donationsRef.doc(id),
        {
          status: 'succeeded',
          settledAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntentId: paymentIntent.id,
          batchId,
        },
        { merge: true }
      );
    }
    await writer.commit();
  }

  await batchRef.set(
    {
      status: 'succeeded',
      stripePaymentIntentId: paymentIntent.id,
      settledAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Versement : la page Versements trie sur `date` et n'affiche le badge
  // « Transféré » que pour le statut 'completed'.
  await writePayout(assoRef, paymentIntent, {
    amount: donationData.amount as number,
    userId: metadata.userId!,
    period: metadata.period ?? '',
  });

  const period = metadata.period ?? '';

  // Le récapitulatif mensuel : c'est le moment où des centimes abstraits
  // deviennent un impact concret pour le donateur.
  const userSnap = await db.collection('users').doc(metadata.userId!).get();
  const email = userSnap.data()?.email;
  if (email) {
    await sendMonthlyRecapEmail(email, {
      amount: donationData.amount as number,
      associationName: metadata.associationName || 'votre association',
      period,
      roundupCount: roundupIds.length,
    });
  }
}

/**
 * Handle failed payment — log for monitoring
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.userId) return;

  const failureData = {
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    status: 'failed',
    userId: metadata.userId,
    associationId: metadata.associationId || '',
    failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
    failureCode: paymentIntent.last_payment_error?.code || null,
    transactionDate: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db
    .collection('users')
    .doc(metadata.userId)
    .collection('payment_failures')
    .doc(paymentIntent.id)
    .set(failureData);

  if (metadata.type === 'roundup_batch' && metadata.batchId) {
    await db.collection('monthly_batches').doc(metadata.batchId).set(
      {
        status: 'failed',
        failureReason: failureData.failureReason,
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // La carte demande une ré-authentification : le mandat doit être resigné.
    const needsReauth = paymentIntent.last_payment_error?.code === 'authentication_required';
    if (needsReauth) {
      await db
        .collection('users')
        .doc(metadata.userId)
        .set({ mandateNeedsReauth: true }, { merge: true });
    }

    const userSnap = await db.collection('users').doc(metadata.userId).get();
    const email = userSnap.data()?.email;
    if (email) {
      await sendPaymentFailedEmail(email, failureData.failureReason, needsReauth);
    }
  }

  console.warn(`❌ Payment failed: ${paymentIntent.id} — ${failureData.failureReason}`);
}

/**
 * Handle refund — update the donation status
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Requête collection-group : nécessite l'index déclaré dans
  // firestore.indexes.json.
  const snapshot = await db
    .collectionGroup('donations')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get();

  // Montant réellement remboursé : `charge.refunded` se déclenche aussi sur
  // un remboursement PARTIEL, qu'il ne faut pas traiter comme un don annulé.
  const refundedAmount = (charge.amount_refunded ?? 0) / 100;
  const fullyRefunded = charge.amount_refunded >= charge.amount;

  const associationIds = new Set<string>();

  for (const doc of snapshot.docs) {
    await doc.ref.set(
      {
        status: fullyRefunded ? 'refunded' : 'partially_refunded',
        refundedAmount,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const assoId = doc.data()?.associationId;
    if (assoId && doc.ref.path.startsWith('associations/')) {
      associationIds.add(assoId);
    }
  }

  // Le compteur cumulé doit refléter le remboursement, sinon les fonds
  // récoltés affichés à l'association ne redescendent jamais.
  for (const assoId of associationIds) {
    await db
      .collection('associations')
      .doc(assoId)
      .set(
        { totalReceived: admin.firestore.FieldValue.increment(-refundedAmount) },
        { merge: true }
      );

    // Le versement correspondant n'est plus « transféré ».
    await db
      .collection('associations')
      .doc(assoId)
      .collection('payouts')
      .doc(paymentIntentId)
      .set(
        { status: fullyRefunded ? 'refunded' : 'partially_refunded', refundedAmount },
        { merge: true }
      )
      .catch(() => {});
  }

  console.log(`🔄 Refund processed for payment: ${paymentIntentId}`);
}
