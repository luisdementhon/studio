import { NextResponse } from "next/server";

/**
 * Route Handler pour l'authentification Bridge (Bankin').
 * Effectue une double requête : 
 * 1. Authentification de l'utilisateur de test.
 * 2. Création d'une session de connexion.
 */
export async function POST() {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Configuration Bridge manquante sur le serveur." },
      { status: 500 }
    );
  }

  try {
    // 1. Authentification pour obtenir l'access_token
    const authResponse = await fetch("https://api.bridgeapi.io/v2/users/user_dotly_test/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Client-Secret": clientSecret,
      },
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return NextResponse.json(
        { error: "Échec de l'authentification Bridge", details: errorData },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // 2. Création de la session de connexion (Connect Session)
    const sessionResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/connect-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}), 
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      return NextResponse.json(
        { error: "Échec de création de session Bridge", details: errorData },
        { status: sessionResponse.status }
      );
    }

    const sessionData = await sessionResponse.json();

    // Renvoi de l'URL de redirection sécurisée
    return NextResponse.json({ redirect_url: sessionData.redirect_url });

  } catch (error: any) {
    console.error("Bridge API Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur lors de la connexion Bridge" },
      { status: 500 }
    );
  }
}
