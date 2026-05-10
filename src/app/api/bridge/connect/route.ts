import { NextResponse } from "next/server";

/**
 * Route Handler pour l'authentification Bridge (Bankin').
 * Effectue une double requête : 
 * 1. Authentification de l'utilisateur de test.
 * 2. Création d'une session de connexion.
 */
export async function POST(request: Request) {
  const clientId = process.env.BRIDGE_CLIENT_ID || "sandbox_id_eb1eb747f61541d68c1f7775ed91278b";
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET || "sandbox_secret_9Qpn7gTnq1kwfD0mCtL5xSt0dK482tKjH5HZ8Bf1SoQgVH96kT7MtvP1uxq9xWXx";

  // Récupérer l'origine pour la callback_url
  const origin = request.headers.get("origin") || "http://localhost:9002";
  
  try {
    const { email, userId, onboarding, callbackUrl: customCallbackUrl } = await request.json().catch(() => ({ email: null, userId: null, onboarding: false, callbackUrl: null }));
    
    // On utilise l'UID s'il est dispo, sinon on dérive de l'email, sinon fallback
    const externalUserId = userId || (email ? email.replace(/[^a-zA-Z0-9]/g, '_') : `user_${Date.now()}`);
    console.log(`DEBUG: Bridge Connect for: ${externalUserId} (onboarding: ${onboarding})`);

    const callbackUrl = customCallbackUrl || (onboarding 
      ? `${origin}/auth/bridge/callback?onboarding=true` 
      : `${origin}/auth/bridge/callback`);

    // 1. Tenter d'obtenir un jeton d'autorisation directement
    let authResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Client-Secret": clientSecret,
      },
      body: JSON.stringify({ external_user_id: externalUserId }),
    });

      // 2. Si l'utilisateur n'existe pas (401), on le crée
    if (authResponse.status === 401) {
      console.log("Utilisateur inconnu sur Bridge, création en cours...");
      const userResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bridge-Version": "2025-01-15",
          "Client-Id": clientId,
          "Client-Secret": clientSecret,
        },
        body: JSON.stringify({ external_user_id: externalUserId }),
      });

      // 409 Conflict est acceptable : cela signifie que l'utilisateur existe déjà
      if (!userResponse.ok && userResponse.status !== 409) {
        const errorData = await userResponse.json();
        console.error("Bridge User Creation Error Details:", JSON.stringify(errorData, null, 2));
        return NextResponse.json(
          { error: "Échec de création de l'utilisateur Bridge", details: errorData },
          { status: userResponse.status }
        );
      }

      // Re-tentative d'obtention du jeton
      authResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/authorization/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Bridge-Version": "2025-01-15",
          "Client-Id": clientId,
          "Client-Secret": clientSecret,
        },
        body: JSON.stringify({ external_user_id: externalUserId }),
      });
    }

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return NextResponse.json(
        { error: "Échec de l'autorisation Bridge", details: errorData },
        { status: authResponse.status }
      );
    }

    const { access_token } = await authResponse.json();

    // 3. Création de la session de connexion (Connect Session)
    const sessionResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/connect-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Client-Secret": clientSecret,
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        user_email: email || "user_dotly_test@example.com",
        callback_url: callbackUrl,
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      console.error("Bridge Session Error:", errorData);
      return NextResponse.json(
        { error: "Échec de création de session Bridge", details: errorData },
        { status: sessionResponse.status }
      );
    }

    const sessionData = await sessionResponse.json();
    
    // Note: V3 renvoie 'url', pas 'redirect_url'
    return NextResponse.json({ redirect_url: sessionData.url });

  } catch (error: any) {
    console.error("Bridge API Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors de la connexion Bridge" },
      { status: 500 }
    );
  }
}
