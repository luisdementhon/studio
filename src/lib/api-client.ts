'use client';

import { initializeFirebase } from '@/firebase';

/**
 * fetch() vers nos routes API, avec le jeton Firebase de l'utilisateur courant
 * en en-tête `Authorization`.
 *
 * À utiliser pour TOUT appel à /api/* qui agit au nom d'un utilisateur : le
 * serveur en déduit l'identité, le client n'a plus à envoyer d'identifiant.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { auth } = initializeFirebase();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Vous devez être connecté pour effectuer cette action.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
