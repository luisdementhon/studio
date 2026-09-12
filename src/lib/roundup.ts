/**
 * Calcul de l'arrondi et choix de l'association bénéficiaire.
 *
 * Logique partagée entre le webhook Bridge (qui écrit les arrondis) et la
 * route de prévisualisation des transactions (qui les affiche) : les deux
 * doivent produire exactement les mêmes montants.
 */

/** Arrondi à l'euro supérieur d'un montant de dépense, en euros. */
export function calculateRoundup(amount: number): number {
  const absAmount = Math.abs(amount);
  const nextEuro = Math.ceil(absAmount);
  const diff = nextEuro - absAmount;
  // On arrondit à 2 décimales pour éviter les erreurs de flottants
  return Math.round(diff * 100) / 100;
}

/** Applique le multiplicateur choisi par le donateur. */
export function applyMultiplier(roundup: number, multiplier: number): number {
  return Math.round(roundup * (multiplier || 1) * 100) / 100;
}

/**
 * Choisit l'association bénéficiaire d'un arrondi, par rotation.
 *
 * Un arrondi ne va jamais qu'à UNE association. Répartir chaque arrondi
 * entre plusieurs bénéficiaires produirait des paiements de quelques
 * centimes, sous le minimum Stripe, et ferait transiter des fonds par
 * Dotly pour être redistribués — ce que le cadre réglementaire proscrit.
 * La répartition se fait donc dans le temps : chaque arrondi va à
 * l'association suivante dans la liste.
 *
 * @returns l'association retenue et l'index à persister pour l'arrondi
 *          suivant, ou `null` si le donateur n'a choisi aucune association.
 */
export function pickAssociation(
  associations: string[] | undefined,
  rotationIndex: number = 0
): { associationId: string; nextRotationIndex: number } | null {
  if (!associations || associations.length === 0) return null;

  const index = Math.abs(Math.trunc(rotationIndex)) % associations.length;

  return {
    associationId: associations[index],
    nextRotationIndex: index + 1,
  };
}
