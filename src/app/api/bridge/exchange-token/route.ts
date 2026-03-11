import { NextResponse } from 'next/server';
import { BRIDGE_CONFIG } from '@/lib/bridge';

// Le Client Secret ne doit être utilisé QUE côté serveur
const BRIDGE_CLIENT_SECRET = process.env.BRIDGE_CLIENT_SECRET || "sandbox_secret_Yv6EdHzK134ZnT3fl5OUpSNNXHMGNsCxrsNEQn20TGAtLqj2Yc61ono0UR1WzZVE";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code d\'autorisation manquant.' }, { status: 400 });
    }

    // Échange du code contre un access token auprès de Bridge
    const response = await fetch('https://api.bridgeapi.io/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bridge-Version': '2021-06-01',
        'Client-Id': BRIDGE_CONFIG.clientId,
        'Client-Secret': BRIDGE_CLIENT_SECRET,
      },
      body: JSON.stringify({
        code,
        grant_type: 'authorization_code',
        redirect_uri: BRIDGE_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Bridge API Error:', errorData);
      return NextResponse.json({ error: errorData.error_message || 'Erreur lors de l\'échange du token.' }, { status: response.status });
    }

    const data = await response.json();
    
    // Récupération du nom de la banque associée à cet "item"
    let bankName = 'Banque Inconnue';
    try {
      const itemResponse = await fetch(`https://api.bridgeapi.io/v2/items/${data.item_id}`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Bridge-Version': '2021-06-01',
          'Client-Id': BRIDGE_CONFIG.clientId,
        }
      });
      if (itemResponse.ok) {
        const itemData = await itemResponse.json();
        bankName = itemData.bank.name;
      }
    } catch (e) {
      console.warn("Could not fetch bank name", e);
    }

    return NextResponse.json({ 
      itemId: data.item_id,
      bankName: bankName,
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
