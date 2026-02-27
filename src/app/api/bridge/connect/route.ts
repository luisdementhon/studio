import { NextResponse } from "next/server";

export async function POST() {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Bridge API credentials in environment variables." },
      { status: 500 }
    );
  }

  try {
    // 1. Authentification de l'utilisateur pour obtenir l'access_token
    // Utilisation de l'utilisateur de test spécifié : user_dotly_test
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
        { error: "Authentication failed", details: errorData },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // 2. Création d'une session de connexion (Connect Session)
    const sessionResponse = await fetch("https://api.bridgeapi.io/v3/aggregation/connect-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bridge-Version": "2025-01-15",
        "Client-Id": clientId,
        "Authorization": `Bearer ${accessToken}`,
      },
      // Note: Vous pouvez ajouter des paramètres ici comme 'redirect_url' si configuré dans Bridge
      body: JSON.stringify({}), 
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      return NextResponse.json(
        { error: "Failed to create connect session", details: errorData },
        { status: sessionResponse.status }
      );
    }

    const sessionData = await sessionResponse.json();

    // On renvoie l'URL de redirection fournie par Bridge
    return NextResponse.json({ redirect_url: sessionData.redirect_url });

  } catch (error: any) {
    console.error("Bridge API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
