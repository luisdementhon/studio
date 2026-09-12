import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { getBridgeCredentials, verifyBridgeSignature } from '@/lib/bridge-server';
import { calculateRoundup, applyMultiplier, pickAssociation } from '@/lib/roundup';

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic';

/**
 * Somme des arrondis déjà en attente de prélèvement pour le mois en cours.
 * Sert à faire respecter le plafond mensuel du mandat.
 */
async function sumPendingThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const snapshot = await db
    .collection('users')
    .doc(userId)
    .collection('donations')
    .where('type', '==', 'roundup')
    .where('status', '==', 'pending')
    .where('transactionDate', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
    .get();

  return snapshot.docs.reduce((total, doc) => total + Number(doc.data().amount || 0), 0);
}

/**
 * Webhook Handler pour Bridge (Bankin').
 * Reçoit les notifications de nouvelles transactions et calcule l'arrondi.
 */
export async function POST(request: Request) {
  // Le corps BRUT doit être lu avant tout parsing : la signature porte sur la
  // chaîne exacte envoyée par Bridge, qu'un JSON.parse/stringify altérerait.
  const rawBody = await request.text();
  const signature = request.headers.get('BridgeApi-Signature');

  if (!verifyBridgeSignature(rawBody, signature)) {
    console.warn('Signature de webhook Bridge invalide : requête rejetée.');
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
  }

  try {
    const { clientId, clientSecret } = getBridgeCredentials();

    const body = JSON.parse(rawBody);

    const eventType = body.type || body.event;

    // Révocation de l'accès bancaire, côté Bridge ou par l'utilisateur depuis
    // sa banque. Sans ce traitement, l'application continuerait d'afficher
    // « banque connectée » pour un accès qui n'existe plus.
    if (eventType === 'item.deleted' || eventType === 'user.deleted') {
      const revokedUuid =
        body.user_uuid || body.content?.user_uuid || body.resource?.user_uuid || body.resource?.user?.uuid;

      if (revokedUuid) {
        const revoked = await db
          .collection('users')
          .where('bridgeUserUuid', '==', revokedUuid)
          .limit(1)
          .get();

        for (const doc of revoked.docs) {
          await doc.ref.set(
            {
              bankConnected: false,
              bankDisconnectedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      return NextResponse.json({ received: true, status: 'bank_access_revoked' });
    }

    // 1. Déterminer les transactions à traiter
    let transactionsToProcess = [];
    let bridgeUserUuid = null;

    if (eventType === 'item.account.updated' || eventType === 'item.refreshed' || eventType === 'item.updated') {
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
      // Isolé volontairement : sans cela, une seule transaction malformée
      // (date invalide, montant illisible) faisait échouer tout le lot, et
      // Bridge rejouait indéfiniment le même paquet.
      try {
      if (typeof t?.amount !== 'number' || !Number.isFinite(t.amount) || t.amount >= 0) continue;

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
        // Écrivable par le client : un multiplicateur non numérique
        // produirait un montant NaN qui contaminerait tout le règlement.
        const rawMultiplier = Number(userData.donationMultiplier);
        const multiplier = Number.isFinite(rawMultiplier) && rawMultiplier >= 1 ? rawMultiplier : 1;
        const finalDonation = applyMultiplier(roundup, multiplier);

        const donationId = `roundup_${t.id}`;
        const donationRef = db.collection('users').doc(userId).collection('donations').doc(donationId);

        // On vérifie si on n'a pas déjà traité cette transaction
        const existingDoc = await donationRef.get();
        if (existingDoc.exists) {
            console.log(`Transaction ${t.id} already processed. Skipping.`);
            continue;
        }

        // Bénéficiaire : un seul par arrondi, par rotation sur les
        // associations soutenues (cf. src/lib/roundup.ts).
        const picked = pickAssociation(userData.associations, userData.roundupRotationIndex ?? 0);

        if (!picked) {
          console.log(`Utilisateur ${userId} sans association : arrondi ignoré.`);
          continue;
        }

        // Plafond mensuel : c'est la borne du mandat signé. On somme ce qui
        // est déjà en attente ce mois-ci avant d'accepter un arrondi de plus.
        const ceiling = Number(userData.donationCeiling ?? 0);
        const pendingTotal = await sumPendingThisMonth(userId);
        const exceedsCeiling = ceiling > 0 && pendingTotal + finalDonation > ceiling;

        await donationRef.set({
          userId: userId,
          associationId: picked.associationId,
          amount: finalDonation,
          originalAmount: amount,
          roundup: roundup,
          multiplier: multiplier,
          description: t.description || t.raw_description || 'Arrondi automatique',
          category: t.category?.name || 'Divers',
          // Timestamp Firestore, jamais une string : les dashboards appellent
          // .toDate() sur ce champ.
          // Une date invalide ferait lever Timestamp.fromDate et,
          // auparavant, tomber tout le lot.
          transactionDate: admin.firestore.Timestamp.fromDate(
            (() => {
              const parsed = t.date ? new Date(t.date) : new Date();
              return isNaN(parsed.getTime()) ? new Date() : parsed;
            })()
          ),
          // 'skipped_ceiling' reste traçable pour le donateur, mais n'est
          // jamais prélevé.
          status: exceedsCeiling ? 'skipped_ceiling' : 'pending',
          type: 'roundup',
          bankName: userData.bankName || 'Banque connectée',
          bridgeTransactionId: t.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // La rotation n'avance que si l'arrondi compte réellement.
        if (!exceedsCeiling) {
          await userDoc.ref.set(
            { roundupRotationIndex: picked.nextRotationIndex },
            { merge: true }
          );
        }

        console.log(
          exceedsCeiling
            ? `PLAFOND: arrondi de ${finalDonation}€ non retenu pour ${userId} (plafond ${ceiling}€)`
            : `SUCCESS: Roundup of ${finalDonation}€ saved for user ${userId} -> ${picked.associationId}`
        );
      }
      } catch (itemError: any) {
        console.error(
          `Transaction Bridge ${t?.id ?? 'inconnue'} ignorée : ${itemError?.message}`
        );
      }
    }

    return NextResponse.json({ received: true, processed: transactionsToProcess.length });
  } catch (error: any) {
    console.error("CRITICAL WEBHOOK ERROR:", error);
    return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 });
  }
}
