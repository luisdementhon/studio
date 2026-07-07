import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Configuration Bridge manquante.' }, { status: 500 });
  }

  try {
    const { userUuid, itemId, email, userId } = await request.json();
    console.log("DEBUG: Exchange Token Request:", { userUuid, itemId, email, userId });

    const externalUserId = userId || email;

    if (!userUuid || !externalUserId) {
      console.error("ERROR: Missing userUuid or externalUserId", { userUuid, externalUserId });
      return NextResponse.json({ error: 'Données manquantes pour la finalisation' }, { status: 400 });
    }

    // Obtenir un token d'accès permanent pour cet utilisateur
    console.log("DEBUG: Fetching Bridge Auth Token for:", externalUserId);
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
      const errorData = await authResponse.json();
      console.error("ERROR: Bridge Auth failed:", errorData);
      return NextResponse.json({ 
        error: 'Échec d\'autorisation pour la finalisation', 
        details: errorData 
      }, { status: authResponse.status });
    }

    const authData = await authResponse.json();
    const { access_token } = authData;
    const bridgeUserUuid = authData.user?.uuid || userUuid;

    // 2. Si on a un itemId, on récupère les détails de la banque
    // Sinon, on peut lister les items récents
    let bankName = 'Banque connectée';
    let finalItemId = itemId;

    try {
      const itemsResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/items", {
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Bridge-Version": "2025-01-15",
          "Client-Id": clientId,
        }
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        const items = itemsData.resources || [];
        
        if (items.length > 0) {
          // On prend soit l'item spécifique, soit le plus récent
          const matchedItem = itemId ? items.find((i: any) => i.id === itemId) : items[0];
          if (matchedItem) {
            bankName = matchedItem.bank?.name || 'Banque connectée';
            finalItemId = matchedItem.id;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch item details in V3", e);
    }

    return NextResponse.json({ 
      bridgeItemId: finalItemId,
      bridgeUserUuid: bridgeUserUuid,
      bankName: bankName,
      status: 'success'
    });

  } catch (error: any) {
    console.error("Internal Server Error Bridge Finalize:", error);
    return NextResponse.json({ error: 'Une erreur interne est survenue lors de la finalisation.' }, { status: 500 });
  }
}
