import { NextResponse } from 'next/server';
import { BRIDGE_CLIENT_ID, REDIRECT_URI } from '@/lib/bridge';

// This secret should be in an environment variable on the server (e.g., process.env.BRIDGE_CLIENT_SECRET)
// For this demo, it's included here as per the context provided.
const BRIDGE_CLIENT_SECRET = 'sandbox_secret_Yv6EdHzK134ZnT3fl5OUpSNNXHMGNsCxrsNEQn20TGAtLqj2Yc61ono0UR1WzZVE';


export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code d\'autorisation manquant.' }, { status: 400 });
    }

    const response = await fetch('https://api.bridgeapi.io/v2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Bridge-Version': '2021-06-01',
            'Client-Id': BRIDGE_CLIENT_ID,
            'Client-Secret': BRIDGE_CLIENT_SECRET,
        },
        body: JSON.stringify({
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Bridge API Error:', errorData);
        return NextResponse.json({ error: errorData.error_message || 'Erreur lors de l\'échange du token avec Bridge.' }, { status: response.status });
    }

    const data = await response.json();
    
    // Fetch bank name from the item details
    let bank_name = 'Banque inconnue';
    if (data.item_id) {
        const itemResponse = await fetch(`https://api.bridgeapi.io/v2/items/${data.item_id}`, {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Bridge-Version': '2021-06-01',
            }
        });
        if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            bank_name = itemData.bank.name;
        }
    }


    return NextResponse.json({ 
        access_token: data.access_token,
        item_id: data.item_id,
        expires_at: data.expires_at,
        bank_name: bank_name,
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: error.message || 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
