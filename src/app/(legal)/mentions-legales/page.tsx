import type { Metadata } from 'next';
import { EDITEUR, HEBERGEUR, SITE, LEGAL_UPDATED_AT } from '@/lib/legal';
import { LegalPage, Section } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Mentions légales — dotly',
  description: "Informations légales relatives à l'éditeur du site dotly.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt={LEGAL_UPDATED_AT}>
      <Section title="Éditeur du service">
        <p>
          Le service <strong>{SITE.nom}</strong>, accessible à l'adresse{' '}
          <a href={SITE.url}>{SITE.url}</a>, est édité par {EDITEUR.nom}, {EDITEUR.statut}.
        </p>
        <p>
          Contact : <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>
        </p>
        <p>Directeur de la publication : {EDITEUR.directeurPublication}.</p>
      </Section>

      <Section title="Hébergement">
        <p>
          Le service est hébergé par <strong>{HEBERGEUR.nom}</strong>, {HEBERGEUR.adresse}, via
          l'offre {HEBERGEUR.service}. Les données sont stockées au sein de l'Union européenne.
        </p>
      </Section>

      <Section title="Prestataires de paiement et d'information sur les comptes">
        <p>
          Les opérations de paiement sont exécutées par <strong>Stripe Payments Europe, Limited</strong>,
          établissement de paiement agréé, dont le siège est situé en Irlande et qui opère en France
          sous le régime du passeport européen.
        </p>
        <p>
          L'accès en lecture seule aux opérations bancaires est assuré par <strong>Bridge</strong>,
          prestataire de services d'information sur les comptes agréé au titre de la deuxième
          directive européenne sur les services de paiement (DSP2).
        </p>
        <p>
          {SITE.nom} n'encaisse à aucun moment les fonds des donateurs : ceux-ci sont versés
          directement aux associations bénéficiaires par l'intermédiaire de Stripe.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments composant le service — marque, identité visuelle, textes,
          interfaces et code — est protégé par le droit de la propriété intellectuelle. Toute
          reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable,
          est interdite.
        </p>
      </Section>

      <Section title="Signalement de contenu">
        <p>
          Toute demande relative au contenu du service peut être adressée à{' '}
          <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
