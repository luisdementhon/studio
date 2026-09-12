import type { Metadata } from 'next';
import Link from 'next/link';
import { EDITEUR, SITE, LEGAL_UPDATED_AT, LEGAL_VERSION } from '@/lib/legal';
import { LegalPage, Section } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — dotly",
  description: "Les conditions d'utilisation du service de micro-dons par arrondi dotly.",
};

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation"
      updatedAt={LEGAL_UPDATED_AT}
      intro={
        <p>
          Ces conditions régissent l'utilisation de {SITE.nom}. Elles décrivent ce que fait le
          service, ce à quoi vous vous engagez en l'utilisant, et ce à quoi nous nous engageons
          envers vous. Version {LEGAL_VERSION}.
        </p>
      }
    >
      <Section title="1. Objet">
        <p>
          {SITE.nom} est un service qui arrondit à l'euro supérieur les paiements par carte
          effectués depuis le compte bancaire que vous y connectez, cumule ces arrondis sur le
          mois, et reverse le total à l'association que vous avez choisie.
        </p>
        <p>
          Les présentes conditions s'appliquent entre {EDITEUR.nom}, éditeur du service (« nous »),
          et toute personne physique qui crée un compte donateur (« vous »). Des conditions
          distinctes régissent la relation avec les associations partenaires.
        </p>
      </Section>

      <Section title="2. Définitions">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Arrondi</strong> : différence entre le montant d'un paiement par carte et
            l'euro supérieur. Un paiement de 2,80 € génère un arrondi de 0,20 €.
          </li>
          <li>
            <strong>Multiplicateur</strong> : coefficient que vous choisissez et qui s'applique à
            chaque arrondi. À ×2, un arrondi de 0,20 € donne un don de 0,40 €.
          </li>
          <li>
            <strong>Plafond mensuel</strong> : montant maximal que nous pouvons prélever au cours
            d'un même mois. Il ne peut jamais être dépassé.
          </li>
          <li>
            <strong>Mandat</strong> : autorisation que vous donnez, une seule fois, de prélever
            mensuellement le cumul de vos arrondis dans la limite du plafond.
          </li>
        </ul>
      </Section>

      <Section title="3. Acceptation et capacité">
        <p>
          La création d'un compte vaut acceptation pleine et entière des présentes conditions. Vous
          devez être majeur, disposer de la capacité juridique de contracter, et être titulaire du
          compte bancaire et du moyen de paiement que vous connectez.
        </p>
      </Section>

      <Section title="4. Fonctionnement du service">
        <p>
          Le service repose sur trois opérations successives :
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Lecture de vos opérations.</strong> Vous autorisez notre prestataire agréé
            Bridge à accéder <strong>en lecture seule</strong> aux opérations de votre compte.
            Aucun ordre de paiement ne peut être émis depuis cet accès. Cette autorisation expire
            périodiquement et doit être renouvelée, conformément à la réglementation DSP2.
          </li>
          <li>
            <strong>Calcul des arrondis.</strong> Pour chaque paiement par carte, nous calculons
            l'arrondi et lui appliquons votre multiplicateur. Si le cumul du mois atteint votre
            plafond, les arrondis suivants ne sont plus retenus.
          </li>
          <li>
            <strong>Prélèvement et reversement.</strong> Une fois par mois, le cumul est prélevé en
            une seule fois sur votre moyen de paiement et versé à l'association bénéficiaire.
          </li>
        </ul>
        <p>
          Lorsque vous soutenez plusieurs associations, chaque arrondi est attribué à une seule
          d'entre elles, à tour de rôle. La répartition s'équilibre ainsi dans le temps, sans
          fractionner les dons en montants trop faibles pour être versés.
        </p>
      </Section>

      <Section title="5. Le mandat de prélèvement">
        <p>
          En enregistrant votre moyen de paiement, vous signez un mandat unique, avec
          authentification forte de votre banque. Ce mandat nous autorise à déclencher les
          prélèvements mensuels ultérieurs sans nouvelle intervention de votre part, dans la
          <strong> stricte limite du plafond mensuel</strong> que vous avez fixé.
        </p>
        <p>
          Vous pouvez à tout moment modifier votre plafond, modifier votre multiplicateur,
          supprimer votre moyen de paiement ou déconnecter votre banque depuis votre espace
          personnel. Toute baisse du plafond s'applique aux prélèvements à venir.
        </p>
        <p>
          Si votre banque exige une nouvelle authentification lors d'un prélèvement, celui-ci
          échoue et nous vous en informons par email. Vos arrondis ne sont pas perdus : ils restent
          en attente jusqu'à ce que le mandat soit à nouveau valide.
        </p>
      </Section>

      <Section title="6. Circuit des fonds">
        <p>
          {SITE.nom} ne détient à aucun moment vos fonds. Le prélèvement est exécuté par Stripe,
          établissement de paiement agréé, qui verse directement le don à l'association
          bénéficiaire sur son propre compte. Nous n'intervenons ni comme dépositaire, ni comme
          intermédiaire de collecte.
        </p>
      </Section>

      <Section title="7. Prix">
        <p>
          Le service est <strong>gratuit pour le donateur</strong>. Aucun frais, aucun abonnement,
          aucune retenue sur vos dons ne vous est facturé.
        </p>
        <p>
          Nous nous rémunérons par une commission prélevée sur le montant du don et supportée par
          l'association bénéficiaire. Le taux applicable est indiqué à l'association dans ses
          propres conditions. Le montant qui vous est prélevé correspond toujours exactement au
          cumul de vos arrondis.
        </p>
      </Section>

      <Section title="8. Reçu fiscal">
        <p>
          Le reçu fiscal est <strong>annuel et cumulé</strong> : il porte sur l'ensemble des dons
          versés à une même association au cours de l'année civile. Il n'est pas émis de reçu par
          don.
        </p>
        <p>
          Le reçu est établi sous la responsabilité de l'association bénéficiaire, seule habilitée
          à attester du don. Le droit à réduction d'impôt dépend du statut de l'association et de
          votre situation personnelle ; nous ne garantissons aucun avantage fiscal.
        </p>
      </Section>

      <Section title="9. Erreurs, contestations et remboursements">
        <p>
          En cas de prélèvement erroné, écrivez-nous à{' '}
          <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a>. Nous étudierons la demande et,
          lorsqu'elle est fondée, procéderons au remboursement.
        </p>
        <p>
          Indépendamment de nous, vous conservez l'intégralité des droits que vous tenez de votre
          banque et du réseau de votre carte pour contester une opération non autorisée, dans les
          conditions et délais prévus par le Code monétaire et financier.
        </p>
        <p>
          Un don régulièrement versé à une association est en revanche définitif : nous ne pouvons
          pas récupérer des fonds déjà transférés à un tiers.
        </p>
      </Section>

      <Section title="10. Vos engagements">
        <ul className="list-disc space-y-2 pl-6">
          <li>Fournir des informations exactes et les tenir à jour.</li>
          <li>N'utiliser que des comptes et moyens de paiement dont vous êtes titulaire.</li>
          <li>Ne pas tenter de contourner, sonder ou perturber le fonctionnement du service.</li>
          <li>Préserver la confidentialité de vos identifiants.</li>
        </ul>
      </Section>

      <Section title="11. Disponibilité et responsabilité">
        <p>
          Nous mettons en œuvre les moyens raisonnables pour assurer la disponibilité et la
          sécurité du service, sans garantir une disponibilité ininterrompue. Le service dépend de
          prestataires tiers (banques, Bridge, Stripe) dont les indisponibilités peuvent retarder
          la lecture des opérations ou l'exécution d'un prélèvement.
        </p>
        <p>
          Notre responsabilité ne saurait être engagée pour les dommages indirects, ni pour
          l'usage que l'association bénéficiaire fait des sommes reçues. Aucune stipulation des
          présentes ne limite notre responsabilité en cas de faute lourde, de dol ou de dommage
          corporel.
        </p>
      </Section>

      <Section title="12. Durée, suspension et résiliation">
        <p>
          Le compte est à durée indéterminée. Vous pouvez le supprimer à tout moment, sans préavis
          ni justification, depuis votre espace personnel. La suppression met fin au mandat ;
          les arrondis en attente non encore prélevés sont abandonnés.
        </p>
        <p>
          Nous pouvons suspendre ou fermer un compte en cas de manquement aux présentes, de
          suspicion de fraude, ou d'obligation légale, après vous en avoir informé sauf lorsque la
          loi l'interdit.
        </p>
      </Section>

      <Section title="13. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>, qui fait partie
          intégrante des présentes conditions.
        </p>
      </Section>

      <Section title="14. Modification des conditions">
        <p>
          Nous pouvons faire évoluer ces conditions. Toute modification substantielle vous sera
          notifiée par email au moins 30 jours avant son entrée en vigueur. Si elle ne vous
          convient pas, vous pouvez supprimer votre compte avant cette date.
        </p>
      </Section>

      <Section title="15. Droit applicable et litiges">
        <p>
          Les présentes conditions sont soumises au droit français.
        </p>
        <p>
          En cas de différend, adressez-nous d'abord une réclamation à{' '}
          <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a> : nous nous engageons à y répondre.
          À défaut de solution amiable, vous pouvez recourir gratuitement à un médiateur de la
          consommation, ou saisir la plateforme européenne de règlement en ligne des litiges à
          l'adresse{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            ec.europa.eu/consumers/odr
          </a>
          . À défaut, les tribunaux français sont compétents.
        </p>
      </Section>
    </LegalPage>
  );
}
