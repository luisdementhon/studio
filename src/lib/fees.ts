/**
 * Commission Dotly, prélevée sur les dons via `application_fee_amount`.
 *
 * Le modèle est « commission payée par l'association » : le donateur est
 * débité du montant plein, l'association reçoit le montant moins la
 * commission, qui arrive sur le compte plateforme.
 */

/** Taux par défaut, en pourcentage. Surchargeable par association. */
const DEFAULT_FEE_PERCENT = 15;

/**
 * Taux effectif de la plateforme, pour l'affichage.
 *
 * Exporté pour que l'interface n'invente pas son propre pourcentage : le
 * dashboard association annonçait 5 % de commission là où le serveur en
 * retenait 15, surestimant chaque virement d'environ 12 %.
 */
export const PLATFORM_FEE_PERCENT = (() => {
  const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT;
  const configured = raw && raw.trim() !== '' ? Number(raw) : NaN;
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_FEE_PERCENT;
})();

function resolveFeePercent(association?: { commissionRate?: number } | null): number {
  if (association?.commissionRate !== undefined && association.commissionRate !== null) {
    return Number(association.commissionRate);
  }

  // Attention : Number('') vaut 0, un nombre fini. Sans le test sur la
  // chaîne vide, une variable définie mais vide annulerait silencieusement
  // toute commission.
  const raw = process.env.PLATFORM_FEE_PERCENT;
  const configured = raw && raw.trim() !== '' ? Number(raw) : NaN;
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_FEE_PERCENT;
}

/**
 * Commission à retenir sur un montant, en centimes.
 *
 * @param amountInCents montant total débité au donateur, en centimes
 * @returns la commission en centimes, bornée à [0, amountInCents]
 */
export function computeFeeAmount(
  amountInCents: number,
  association?: { commissionRate?: number } | null
): number {
  const percent = resolveFeePercent(association);

  if (!Number.isFinite(percent) || percent <= 0) return 0;

  const fee = Math.round((amountInCents * percent) / 100);

  // Ne jamais retenir plus que le montant lui-même : Stripe rejetterait
  // le PaymentIntent et l'association recevrait zéro.
  return Math.max(0, Math.min(fee, amountInCents));
}
