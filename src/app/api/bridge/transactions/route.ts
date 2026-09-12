import { NextResponse } from 'next/server';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { getBridgeCredentials } from '@/lib/bridge-server';
import { db } from '@/lib/firebase-admin';
import { calculateRoundup, applyMultiplier } from '@/lib/roundup';

export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const { clientId, clientSecret } = getBridgeCredentials();

    // L'identité vient du jeton : impossible de lire les transactions d'un tiers.
    const externalUserId = decoded.uid;

    // Le multiplicateur est lu en base, jamais accepté depuis le client :
    // il intervient dans le calcul des montants.
    const userSnap = await db.collection('users').doc(externalUserId).get();
    const multiplier = userSnap.data()?.donationMultiplier || 1;

    // 1. Obtenir un jeton d'autorisation pour l'utilisateur
    const authResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Client-Secret": clientSecret,
      },
      body: JSON.stringify({ external_user_id: externalUserId }),
    });

    if (!authResponse.ok) {
      console.error("Bridge Auth Error:", await authResponse.text());
      return NextResponse.json({
        transactions: [],
        totalDonations: 0,
        count: 0,
        warning: 'L\'utilisateur n\'est pas encore authentifié sur Bridge ou la banque n\'est pas connectée.'
      });
    }

    const { access_token } = await authResponse.json();

    // 2. Récupérer les transactions
    const transactionsResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/transactions?limit=50", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
      }
    });

    if (!transactionsResponse.ok) {
      const errorData = await transactionsResponse.json();
      console.warn("Bridge Transactions Fetch Warning:", errorData);
      return NextResponse.json({
        transactions: [],
        totalDonations: 0,
        count: 0,
        error: 'Impossible de récupérer les transactions bancaires pour le moment.'
      });
    }

    const transactionsData = await transactionsResponse.json();
    const rawTransactions = transactionsData.resources || [];

    // 3. Calculer les arrondis
    const transactions = rawTransactions
      .filter((t: any) => t.amount < 0) // On ne garde que les dépenses
      .map((t: any) => {
        const amount = Math.abs(t.amount);
        const roundup = calculateRoundup(amount);
        const finalDonation = applyMultiplier(roundup, multiplier);

        return {
          id: t.id,
          date: t.date,
          description: t.description || t.raw_description,
          category: t.category?.name || 'Divers',
          amount: amount,
          roundup: roundup,
          multiplier: multiplier,
          finalDonation: finalDonation,
          bankName: t.account?.item?.bank?.name
        };
      });

    // Calculer le total
    const totalDonations = transactions.reduce((sum: number, t: any) => sum + t.finalDonation, 0);

    return NextResponse.json({
      transactions,
      totalDonations: Math.round(totalDonations * 100) / 100,
      count: transactions.length
    });

  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Internal Server Error Bridge Transactions:", error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
