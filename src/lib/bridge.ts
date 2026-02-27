// Configuration pour l'API Bridge
// Les valeurs préfixées par NEXT_PUBLIC_ sont accessibles côté client (navigateur)

export const BRIDGE_CONFIG = {
  // Votre Client ID (Public)
  clientId: process.env.NEXT_PUBLIC_BRIDGE_CLIENT_ID || "sandbox_id_eb1eb747f61541d68c1f7775ed91278b",
  
  // L'URL de redirection doit être exactement celle configurée dans votre dashboard Bridge
  redirectUri: "https://preview-6613366678.us-central1.run.app/auth/bridge/callback",
  
  // URL de base de l'authentification (Connect)
  baseUrl: "https://connect.bridgeapi.io/authorize",
};

/**
 * Génère l'URL de connexion Bridge
 */
export const getBridgeAuthUrl = () => {
  const url = new URL(BRIDGE_CONFIG.baseUrl);
  url.searchParams.append("client_id", BRIDGE_CONFIG.clientId);
  url.searchParams.append("redirect_uri", BRIDGE_CONFIG.redirectUri);
  url.searchParams.append("response_type", "code");
  return url.toString();
};
