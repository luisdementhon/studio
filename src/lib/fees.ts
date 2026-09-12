/**
 * Commission Dotly, prélevée sur les dons via `application_fee_amount`.
 *
 * Le modèle est « commission payée par l'association » : le donateur est
 * débité du montant plein, l'association reçoit le montant moins la
 * commission, qui arrive sur le compte plateforme.
 */

/** Taux par défaut, en pourcentage. Surchargeable par association. */
const DEFAULT_FEE_PERCENT = 15;

function resolveFeePercent(association?: { commissionRate?: number } | null): number {
  if (association?.commissionRate !== undefined && association.commissionRate !== null) {
    return Number(association.commissionRate);
  }

  const configured = Number(process.env.PLATFORM_FEE_PERCENT);
  return Number.isFinite(configured) ? configured : DEFAULT_FEE_PERCENT;
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
