/**
 * Vérification d'un numéro RNA auprès de l'annuaire des entreprises de l'État.
 *
 * Utilisé à deux endroits : la vérification interactive pendant la saisie du
 * formulaire, et la re-vérification au moment de l'enregistrement. La seconde
 * fait foi — un contrôle uniquement côté navigateur se contourne.
 */

export interface RnaAssociation {
  titre: string;
  objet: string;
  adresse_siege: string;
  date_creation: string;
}

export type RnaResult =
  | { valid: true; association: RnaAssociation }
  | { valid: false; error: string; status?: number };

const RNA_REGEX = /^W\d{9}$/;

export async function verifyRna(rna: string): Promise<RnaResult> {
  const normalized = (rna || '').trim().toUpperCase();

  if (!RNA_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Format invalide. Le numéro RNA doit commencer par W suivi de 9 chiffres (ex: W751000001).',
      status: 400,
    };
  }

  try {
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${normalized}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 }, // Cache 24h
      }
    );

    if (!response.ok) {
      return {
        valid: false,
        error: 'Erreur lors de la vérification. Veuillez réessayer.',
        status: 502,
      };
    }

    const data = await response.json();

    // On exige une correspondance exacte du RNA : l'API fait de la recherche
    // approximative et renverrait volontiers une association voisine.
    const match = data.results?.[0];
    if (!match || match.complements?.identifiant_association !== normalized) {
      return { valid: false, error: 'Aucune association trouvée avec ce numéro RNA.' };
    }

    return {
      valid: true,
      association: {
        titre: match.nom_complet || 'Association vérifiée',
        objet: match.activite_principale || '',
        adresse_siege: match.siege?.adresse
          ? `${match.siege.adresse} ${match.siege.code_postal} ${match.siege.libelle_commune}`
          : '',
        date_creation: match.date_creation || '',
      },
    };
  } catch (error) {
    console.error('RNA verification error:', error);
    return { valid: false, error: 'Service de vérification indisponible.', status: 503 };
  }
}
