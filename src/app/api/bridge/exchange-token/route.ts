import { NextResponse } from 'next/server';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { getBridgeCredentials } from '@/lib/bridge-server';

export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const { clientId, clientSecret } = getBridgeCredentials();

    const { userUuid, itemId } = await request.json();

    // L'identité vient du jeton vérifié.
    const externalUserId = decoded.uid;

    if (!userUuid) {
      console.error("ERROR: Missing userUuid");
      return NextResponse.json({ error: 'Données manquantes pour la finalisation' }, { status: 400 });
    }

    // Obtenir un token d'accès permanent pour cet utilisateur
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
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Internal Server Error Bridge Finalize:", error);
    return NextResponse.json({ error: 'Une erreur interne est survenue lors de la finalisation.' }, { status: 500 });
  }
}
