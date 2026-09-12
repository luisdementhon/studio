import crypto from 'crypto';

/**
 * Authentifie un appelant machine (Cloud Scheduler) sur les routes /api/cron/*.
 *
 * Ces routes ne sont pas appelées par un utilisateur : pas de jeton Firebase
 * ici, mais un secret partagé. Comme pour les webhooks, l'absence de secret
 * configuré fait échouer la vérification plutôt que de laisser passer.
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error('CRON_SECRET absent : appel cron refusé.');
    return false;
  }

  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const provided = Buffer.from(match[1].trim(), 'utf8');
  const expected = Buffer.from(secret, 'utf8');

  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

/** Période de règlement au format `YYYY-MM`. */
export function formatPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Bornes du mois à régler.
 *
 * Par défaut on règle le mois écoulé : le job tourne au début du mois
 * suivant, une fois toutes les transactions du mois remontées par Bridge
 * (les banques ont jusqu'à 1-2 jours de délai).
 */
export function resolvePeriod(explicit?: string | null): { period: string; start: Date; end: Date } {
  let reference: Date;

  if (explicit && /^\d{4}-\d{2}$/.test(explicit)) {
    const [year, month] = explicit.split('-').map(Number);
    reference = new Date(year, month - 1, 1);
  } else {
    const now = new Date();
    reference = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);

  return { period: formatPeriod(start), start, end };
}
