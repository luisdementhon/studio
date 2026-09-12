/**
 * Constantes des documents légaux.
 *
 * Centralisées ici pour que les trois pages (mentions légales, CGU,
 * confidentialité) restent cohérentes, et qu'une mise à jour se fasse en un
 * seul endroit.
 *
 * ⚠️ À LA CRÉATION DE LA SASU : remplacer le bloc `EDITEUR` par les mentions
 * de la société (dénomination, forme, capital, SIREN, RCS, siège, TVA
 * intracommunautaire). Tant que la société n'existe pas, le service est
 * légalement édité par une personne physique, et c'est ce que disent les
 * documents — ils sont exacts en l'état, pas provisoires.
 */

export const LEGAL_VERSION = '2026-09-01';

export const LEGAL_UPDATED_AT = '12 septembre 2026';

export const EDITEUR = {
  nom: 'Luis Dementhon',
  statut: 'personne physique',
  email: 'bonjour@dotly-app.fr',
  directeurPublication: 'Luis Dementhon',
} as const;

export const HEBERGEUR = {
  nom: 'Google Cloud EMEA Limited',
  adresse: '70 Sir John Rogerson’s Quay, Dublin 2, Irlande',
  service: 'Firebase App Hosting',
} as const;

export const SITE = {
  nom: 'dotly',
  url: 'https://dotly-app.fr',
  contact: 'bonjour@dotly-app.fr',
} as const;

/** Sous-traitants au sens de l'article 28 du RGPD. */
export const SOUS_TRAITANTS = [
  {
    nom: 'Stripe Payments Europe, Limited',
    role: 'Exécution des paiements, conservation des moyens de paiement, versement aux associations',
    localisation: 'Irlande (Union européenne)',
    donnees: 'Identité, email, données de carte bancaire, montants',
  },
  {
    nom: "Bridge (Bankin' — prestataire agréé DSP2)",
    role: "Agrégation bancaire en lecture seule, pour le calcul de l'arrondi",
    localisation: 'France (Union européenne)',
    donnees: 'Libellés, montants et dates des opérations par carte',
  },
  {
    nom: 'Google Ireland Limited (Firebase)',
    role: 'Hébergement, base de données, authentification',
    localisation: 'Union européenne, avec transferts possibles hors UE',
    donnees: "L'ensemble des données du compte",
  },
  {
    nom: 'Resend, Inc.',
    role: 'Envoi des emails transactionnels',
    localisation: 'États-Unis (clauses contractuelles types)',
    donnees: 'Adresse email, prénom, montants des dons',
  },
] as const;

/**
 * Durées de conservation.
 *
 * Les durées fiscales et comptables ne coïncident pas : le Livre des
 * procédures fiscales impose 6 ans, le Code de commerce 10 ans pour les
 * pièces comptables. On retient la plus longue là où un document est à la
 * fois comptable et fiscal.
 */
export const CONSERVATION = [
  {
    donnees: 'Compte et préférences de don',
    duree: "Jusqu'à la suppression du compte",
    motif: 'Exécution du service',
  },
  {
    donnees: 'Opérations bancaires lues via Bridge',
    duree: "13 mois glissants, puis suppression",
    motif: "Calcul de l'arrondi et justification du montant prélevé",
  },
  {
    donnees: 'Historique des dons et versements',
    duree: '10 ans',
    motif: 'Obligation comptable (article L.123-22 du Code de commerce)',
  },
  {
    donnees: 'Reçus fiscaux',
    duree: '6 ans',
    motif: 'Obligation fiscale (article L.102 B du Livre des procédures fiscales)',
  },
  {
    donnees: 'Preuve du consentement et du mandat',
    duree: "5 ans après la fin de la relation",
    motif: 'Prescription civile de droit commun',
  },
  {
    donnees: 'Compte inactif (aucune connexion, aucun don)',
    duree: '3 ans',
    motif: 'Recommandation de la CNIL',
  },
] as const;
