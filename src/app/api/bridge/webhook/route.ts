import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';

/**
 * Calcule l'arrondi pour un montant donné
 */
function calculateRoundup(amount: number) {
  const absAmount = Math.abs(amount);
  const nextEuro = Math.ceil(absAmount);
  const diff = nextEuro - absAmount;
  // On arrondit à 2 décimales pour éviter les erreurs de flottants
  return Math.round(diff * 100) / 100;
}

/**
 * Webhook Handler pour Bridge (Bankin').
 * Reçoit les notifications de nouvelles transactions et calcule l'arrondi.
 */
export async function POST(request: Request) {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("CRITICAL: Bridge credentials missing in webhook handler.");
    return NextResponse.json({ error: "Configuration Bridge manquante." }, { status: 500 });
  }

  try {
    const body = await request.json();
    console.log("DEBUG: Bridge Webhook Received:", JSON.stringify(body, null, 2));

    const eventType = body.type || body.event;
    
    // 1. Déterminer les transactions à traiter
    let transactionsToProcess = [];
    let bridgeUserUuid = null;

    if (eventType === 'transaction.created' || eventType === 'transactions.created') {
      transactionsToProcess = body.resources || (body.resource ? [body.resource] : []);
      if (transactionsToProcess.length > 0) {
        const first = transactionsToProcess[0];
        bridgeUserUuid = first.user_uuid || first.content?.user_uuid || first.resource?.user_uuid || first.account?.user?.uuid || first.user?.uuid;
      }
    } 
    else if (eventType === 'item.account.updated' || eventType === 'item.refreshed' || eventType === 'item.updated') {
      // Pour ces événements, Bridge ne nous envoie pas forcément les transactions dans le payload.
      // On doit aller les chercher nous-mêmes.
      bridgeUserUuid = body.user_uuid || body.content?.user_uuid || body.resource?.user_uuid || body.resource?.user?.uuid;
      const itemId = body.resource?.id || body.content?.id || body.item_id;

      if (bridgeUserUuid) {
        console.log(`Webhook ${eventType} received for user ${bridgeUserUuid}. Fetching latest transactions...`);
        
        // Trouver l'utilisateur pour avoir son external_id (email)
        const userSnapshot = await db.collection('users').where('bridgeUserUuid', '==', bridgeUserUuid).limit(1).get();
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          const externalId = userSnapshot.docs[0].id; // On utilise l'ID du doc (UID) comme external_id

          // Obtenir un token d'accès
          const authResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Bridge-Version": "2025-01-15",
              "Client-Id": clientId,
              "Client-Secret": clientSecret,
            },
            body: JSON.stringify({ external_user_id: externalId }),
          });

          if (authResponse.ok) {
            const { access_token } = await authResponse.json();
            
            // Récupérer les transactions récentes (ex: depuis 1 heure ou juste les 10 dernières)
            const transResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/transactions?limit=20", {
              headers: {
                "Authorization": `Bearer ${access_token}`,
                "Bridge-Version": "2025-01-15",
                "Client-Id": clientId,
              }
            });

            if (transResponse.ok) {
              const transData = await transResponse.json();
              transactionsToProcess = transData.resources || [];
              console.log(`Fetched ${transactionsToProcess.length} transactions for processing.`);
            }
          }
        }
      }
    }

    if (transactionsToProcess.length === 0) {
      return NextResponse.json({ received: true, status: 'no_transactions_to_process' });
    }

    // 2. Traiter chaque transaction
    for (const t of transactionsToProcess) {
      if (t.amount >= 0) continue;

      const currentBridgeUserUuid = t.user_uuid || t.content?.user_uuid || t.resource?.user_uuid || t.account?.user?.uuid || t.user?.uuid || bridgeUserUuid;
      
      const usersSnapshot = await db.collection('users')
        .where('bridgeUserUuid', '==', currentBridgeUserUuid)
        .limit(1)
        .get();

      if (usersSnapshot.empty) continue;

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      const amount = Math.abs(t.amount);
      const roundup = calculateRoundup(amount);
      
      if (roundup > 0) {
        const multiplier = userData.donationMultiplier || 1;
        const finalDonation = Math.round(roundup * multiplier * 100) / 100;

        const donationId = `roundup_${t.id}`;
        const donationRef = db.collection('users').doc(userId).collection('donations').doc(donationId);
        
        // On vérifie si on n'a pas déjà traité cette transaction
        const existingDoc = await donationRef.get();
        if (existingDoc.exists) {
            console.log(`Transaction ${t.id} already processed. Skipping.`);
            continue;
        }

        await donationRef.set({
          id: donationId,
          userId: userId,
          amount: finalDonation,
          originalAmount: amount,
          roundup: roundup,
          multiplier: multiplier,
          description: t.description || t.raw_description || 'Arrondi automatique',
          category: t.category?.name || 'Divers',
          transactionDate: t.date || new Date().toISOString(),
          status: 'pending',
          type: 'roundup',
          bankName: userData.bankName || 'Banque connectée',
          bridgeTransactionId: t.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`SUCCESS: Roundup of ${finalDonation}€ saved for user ${userId}`);
      }
    }

    return NextResponse.json({ received: true, processed: transactionsToProcess.length });
  } catch (error: any) {
    console.error("CRITICAL WEBHOOK ERROR:", error);
    return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 });
  }
}
