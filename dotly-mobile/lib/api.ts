import Constants from 'expo-constants';

/**
 * Récupère l'URL de base de l'API Next.js.
 * En développement local, il essaie de déduire l'IP de la machine de dev 
 * via le manifest Expo pour que l'iPhone puisse y accéder.
 */
export const getApiBaseUrl = () => {
  // 1. Si une URL est définie en variable d'environnement
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Déduction automatique en développement (LAN)
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // debuggerHost ressemble à "192.168.1.50:8081"
    const ip = debuggerHost.split(':')[0];
    // On présume que le serveur Next.js tourne sur le port 3000
    return `http://${ip}:3000`;
  }

  // 3. Fallback final
  return 'http://localhost:3000';
};

/**
 * Wrapper utilitaire pour fetch() pointant vers l'API Next.js
 */
export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  return fetch(url, options);
};
