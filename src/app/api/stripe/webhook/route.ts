import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase-admin';

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

  try {
    switch (event.type) {
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
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

  const donationData = {
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency,
    status: 'succeeded',
    userId: metadata.userId,
    associationId: metadata.associationId,
    associationName: metadata.associationName || '',
    type: metadata.type || 'one-time', // 'one-time' | 'roundup'
    transactionDate: new Date(),
    createdAt: new Date(),
  };

  // Write to user's donations subcollection
  const donationRef = db.collection('users').doc(metadata.userId).collection('donations').doc(paymentIntent.id);
  await donationRef.set(donationData);

  // Update the association's received donations total
  const assoRef = db.collection('associations').doc(metadata.associationId);
  const assoSnap = await assoRef.get();
  
  if (assoSnap.exists) {
    const currentTotal = assoSnap.data()?.totalReceived || 0;
    await assoRef.update({
      totalReceived: currentTotal + donationData.amount,
      lastDonationDate: new Date(),
    });
  }

  console.log(`✅ Donation recorded: ${donationData.amount}€ from ${metadata.userId} to ${metadata.associationId}`);
}

/**
 * Handle failed payment — log for monitoring
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;
  
  if (!metadata?.userId) return;

  // Log the failed payment for the user
  const failureData = {
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    status: 'failed',
    userId: metadata.userId,
    associationId: metadata.associationId || '',
    failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
    transactionDate: new Date(),
  };

  await db.collection('users').doc(metadata.userId).collection('payment_failures').doc(paymentIntent.id).set(failureData);
  
  console.warn(`❌ Payment failed: ${paymentIntent.id} — ${failureData.failureReason}`);
}

/**
 * Handle refund — update the donation status
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Find and update the donation across all users
  const usersSnapshot = await db.collectionGroup('donations')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get();

  for (const doc of usersSnapshot.docs) {
    await doc.ref.update({ 
      status: 'refunded',
      refundedAt: new Date(),
    });
  }

  console.log(`🔄 Refund processed for payment: ${paymentIntentId}`);
}
