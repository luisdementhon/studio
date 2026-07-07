import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Configuration Bridge manquante.' }, { status: 500 });
  }

  try {
    const { email, userId, multiplier = 1 } = await request.json().catch(() => ({ email: null, userId: null, multiplier: 1 }));

    if (!email && !userId) {
      return NextResponse.json({ error: 'Identifiant utilisateur manquant.' }, { status: 400 });
    }

    // Même logique que dans /api/bridge/connect pour retrouver le bon utilisateur
    const externalUserId = userId || (email ? email.replace(/[^a-zA-Z0-9]/g, '_') : null);

    if (!externalUserId) {
       return NextResponse.json({ error: 'Identifiant utilisateur invalide.' }, { status: 400 });
    }

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
        const finalDonation = Math.round(roundup * multiplier * 100) / 100;

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
    console.error("Internal Server Error Bridge Transactions:", error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
