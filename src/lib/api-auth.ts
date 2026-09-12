import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { auth } from '@/lib/firebase-admin';

/**
 * Erreur d'authentification d'une route API.
 * Portée par requireUser(), à traduire en réponse via apiAuthErrorResponse().
 */
export class ApiAuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/**
 * Vérifie le jeton Firebase envoyé en en-tête `Authorization: Bearer <idToken>`
 * et renvoie le token décodé.
 *
 * L'identité de l'appelant DOIT toujours venir d'ici, jamais du corps de la
 * requête : un `userId` fourni par le client est une donnée, pas une preuve.
 */
export async function requireUser(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new ApiAuthError(401, 'Authentification requise.');
  }

  try {
    return await auth.verifyIdToken(match[1].trim());
  } catch {
    throw new ApiAuthError(401, 'Session invalide ou expirée. Veuillez vous reconnecter.');
  }
}

/**
 * Traduit une ApiAuthError en réponse HTTP. Renvoie null pour toute autre
 * erreur, que l'appelant doit alors gérer lui-même.
 */
export function apiAuthErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
