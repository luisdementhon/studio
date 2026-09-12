import crypto from 'crypto';

/**
 * Identifiants Bridge, côté serveur uniquement.
 *
 * Aucune valeur par défaut : des secrets en dur dans le code finissent dans
 * git. Si la configuration manque, on échoue franchement plutôt que de partir
 * silencieusement sur des identifiants de sandbox.
 */
export function getBridgeCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.BRIDGE_CLIENT_ID;
  const clientSecret = process.env.BRIDGE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Configuration Bridge manquante : BRIDGE_CLIENT_ID et BRIDGE_CLIENT_SECRET doivent être définis.'
    );
  }

  return { clientId, clientSecret };
}

/**
 * Vérifie la signature d'un webhook Bridge.
 *
 * Spec Bridge : en-tête `BridgeApi-Signature` contenant une ou plusieurs
 * valeurs préfixées par un schéma, séparées par des virgules
 * (`v1=ABC...,v1=DEF...`). Chaque signature est un HMAC-SHA256 du corps BRUT
 * de la requête, encodé en hexadécimal majuscule, avec le secret du webhook
 * comme clé.
 *
 * Plusieurs signatures peuvent coexister : lors d'une rotation de secret
 * depuis le dashboard, l'ancien secret reste actif 24 h et Bridge envoie une
 * signature par secret. On accepte donc si l'une d'elles correspond.
 *
 * Seul le schéma `v1` est pris en compte : ignorer les autres protège d'une
 * attaque par downgrade.
 *
 * @param rawBody Corps de la requête tel que reçu, NON reparsé.
 */
export function verifyBridgeSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.BRIDGE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('BRIDGE_WEBHOOK_SECRET absent : webhook Bridge refusé.');
    return false;
  }

  if (!signatureHeader) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
    .toUpperCase();

  const expectedBuffer = Buffer.from(expected, 'utf8');

  const providedSignatures = signatureHeader
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith('v1='))
    .map((part) => part.slice('v1='.length).trim().toUpperCase());

  return providedSignatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, 'utf8');
    // timingSafeEqual exige des longueurs identiques.
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });
}
