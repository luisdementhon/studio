import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — dotly",
  description: "Les conditions d'utilisation du service dotly.",
  // Non indexable tant que le texte n'est pas validé juridiquement.
  robots: { index: false, follow: false },
};

export default function CguPage() {
  return (
    <>
      <h1 className="text-5xl font-headline font-extrabold tracking-tight">
        Conditions générales d'utilisation
      </h1>

      <div className="rounded-2xl border-2 border-dashed border-brand-coral/30 bg-brand-coral/5 p-6 text-sm">
        <strong className="block mb-1">Document en cours de rédaction.</strong>
        Les points ci-dessous reflètent le fonctionnement réel du service. Ils
        doivent être rédigés et validés juridiquement avant toute ouverture des
        inscriptions au public.
      </div>

      <h2 className="text-2xl font-bold pt-6">Le service</h2>
      <p className="text-foreground/70">
        dotly arrondit vos paiements par carte à l'euro supérieur, cumule la
        différence sur le mois, et la reverse à l'association que vous avez
        choisie. Le service est gratuit pour le donateur ; dotly se rémunère
        par une commission prélevée sur le don, à la charge de l'association.
      </p>

      <h2 className="text-2xl font-bold pt-6">Mandat de prélèvement</h2>
      <p className="text-foreground/70">
        En enregistrant votre moyen de paiement, vous autorisez dotly à
        prélever mensuellement le cumul de vos arrondis,{' '}
        <strong>dans la limite du plafond mensuel que vous fixez</strong>. Ce
        plafond ne peut jamais être dépassé. Vous pouvez le modifier ou
        interrompre le service à tout moment depuis votre espace personnel.
      </p>

      <h2 className="text-2xl font-bold pt-6">Reçu fiscal</h2>
      <p className="text-foreground/70">
        Un reçu fiscal annuel et cumulé est établi par l'association
        bénéficiaire pour l'ensemble des dons de l'année civile. Il n'est pas
        émis de reçu par don.
      </p>

      <h2 className="text-2xl font-bold pt-6">À compléter</h2>
      <ul className="list-disc pl-6 space-y-2 text-foreground/70">
        <li>Identité de l'éditeur et mentions légales (après création de la société).</li>
        <li>Conditions applicables aux associations partenaires et taux de commission.</li>
        <li>Responsabilité, disponibilité du service, résiliation.</li>
        <li>Droit applicable et règlement des litiges, médiation de la consommation.</li>
      </ul>
    </>
  );
}
