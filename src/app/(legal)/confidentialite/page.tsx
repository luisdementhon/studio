import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — dotly',
  description: 'Comment dotly traite vos données personnelles.',
  // Tant que le texte n'est pas validé juridiquement, la page ne doit pas
  // être indexée : une politique de confidentialité incomplète référencée
  // engage plus qu'elle ne protège.
  robots: { index: false, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="text-5xl font-headline font-extrabold tracking-tight">
        Politique de confidentialité
      </h1>

      <div className="rounded-2xl border-2 border-dashed border-brand-coral/30 bg-brand-coral/5 p-6 text-sm">
        <strong className="block mb-1">Document en cours de rédaction.</strong>
        Le contenu ci-dessous décrit les traitements réellement effectués par
        l'application, à titre informatif. Il doit être complété et validé
        juridiquement avant toute ouverture au public.
      </div>

      <h2 className="text-2xl font-bold pt-6">Données que nous traitons</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/70">
        <li><strong>Compte</strong> : adresse email, nom, prénom, photo de profil facultative.</li>
        <li><strong>Préférences de don</strong> : causes, associations soutenues, plafond mensuel, multiplicateur.</li>
        <li><strong>Données bancaires (lecture seule)</strong> : libellé, montant et date de vos opérations par carte, obtenus via notre prestataire d'agrégation Bridge, aux seules fins de calculer l'arrondi.</li>
        <li><strong>Paiement</strong> : identifiants Stripe, marque et quatre derniers chiffres de la carte. dotly ne stocke jamais le numéro complet.</li>
        <li><strong>Dons</strong> : montants, dates, associations bénéficiaires.</li>
      </ul>

      <h2 className="text-2xl font-bold pt-6">Sous-traitants</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/70">
        <li><strong>Stripe Payments Europe</strong> — exécution des paiements.</li>
        <li><strong>Bridge (Bankin')</strong> — agrégation bancaire, prestataire agréé DSP2.</li>
        <li><strong>Google Firebase</strong> — hébergement et base de données.</li>
        <li><strong>Resend</strong> — envoi des emails transactionnels.</li>
      </ul>

      <h2 className="text-2xl font-bold pt-6">Vos droits</h2>
      <p className="text-foreground/70">
        Vous pouvez à tout moment exporter l'intégralité de vos données ou
        supprimer votre compte depuis votre espace personnel. La suppression
        efface votre profil, révoque l'accès à votre compte bancaire et
        supprime vos informations de paiement. Les dons déjà versés sont
        conservés de façon anonymisée par les associations bénéficiaires, au
        titre de leurs obligations comptables.
      </p>

      <h2 className="text-2xl font-bold pt-6">Contact</h2>
      <p className="text-foreground/70">
        Pour toute question relative à vos données : bonjour@dotly-app.fr
      </p>
    </>
  );
}
