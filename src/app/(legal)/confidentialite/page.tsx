import type { Metadata } from 'next';
import Link from 'next/link';
import { EDITEUR, SITE, SOUS_TRAITANTS, CONSERVATION, LEGAL_UPDATED_AT } from '@/lib/legal';
import { LegalPage, Section, LegalTable } from '@/components/legal/legal-page';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — dotly',
  description: 'Quelles données dotly traite, pourquoi, combien de temps, et quels sont vos droits.',
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt={LEGAL_UPDATED_AT}
      intro={
        <p>
          {SITE.nom} lit vos opérations bancaires. C'est une donnée sensible, et vous méritez de
          savoir précisément ce que nous en faisons. Ce document dit tout : ce que nous collectons,
          pourquoi, à qui nous le transmettons, combien de temps nous le gardons.
        </p>
      }
    >
      <Section title="L'essentiel en trois points">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            L'accès à votre banque est en <strong>lecture seule</strong>. Aucun ordre de paiement
            ne peut en être émis.
          </li>
          <li>
            Nous ne vendons ni ne louons vos données, et ne les utilisons pas à des fins
            publicitaires.
          </li>
          <li>
            Vous pouvez exporter l'intégralité de vos données ou supprimer votre compte en deux
            clics, depuis votre espace personnel.
          </li>
        </ul>
      </Section>

      <Section title="Responsable du traitement">
        <p>
          Le responsable du traitement est {EDITEUR.nom}, {EDITEUR.statut}, joignable à{' '}
          <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>. Pour toute question relative à
          vos données, cette adresse est le point de contact.
        </p>
      </Section>

      <Section title="Données traitées, finalités et bases légales">
        <LegalTable
          headers={['Données', 'Pourquoi', 'Base légale']}
          rows={[
            [
              'Email, mot de passe, nom, prénom, photo facultative',
              'Créer et sécuriser votre compte',
              'Exécution du contrat (art. 6.1.b)',
            ],
            [
              'Causes, associations soutenues, plafond mensuel, multiplicateur',
              'Calculer et orienter vos dons selon vos choix',
              'Exécution du contrat',
            ],
            [
              'Libellé, montant et date de vos opérations par carte',
              "Calculer l'arrondi. Ces données ne servent à rien d'autre : aucun profilage, aucune analyse de vos habitudes",
              'Exécution du contrat, sur la base de votre consentement explicite à la connexion bancaire (DSP2)',
            ],
            [
              'Identifiants Stripe, marque et 4 derniers chiffres de la carte',
              'Exécuter les prélèvements mensuels',
              'Exécution du contrat',
            ],
            [
              'Historique des dons, versements, reçus fiscaux',
              'Assurer le suivi, établir les reçus, tenir la comptabilité',
              'Obligation légale (art. 6.1.c)',
            ],
            [
              'Date et version des conditions acceptées, preuve du mandat',
              'Prouver votre consentement en cas de contestation',
              'Obligation légale et intérêt légitime (art. 6.1.f)',
            ],
            [
              'Journaux techniques et adresses IP',
              'Sécuriser le service, détecter les abus',
              'Intérêt légitime',
            ],
          ]}
        />
        <p>
          Nous ne procédons à <strong>aucune décision automatisée</strong> produisant des effets
          juridiques à votre égard, ni à aucun profilage publicitaire.
        </p>
      </Section>

      <Section title="Destinataires">
        <p>
          Vos données ne sont transmises qu'aux prestataires strictement nécessaires au
          fonctionnement du service, qui agissent sur nos instructions :
        </p>
        <LegalTable
          headers={['Prestataire', 'Rôle', 'Données', 'Localisation']}
          rows={SOUS_TRAITANTS.map((s) => [s.nom, s.role, s.donnees, s.localisation])}
        />
        <p>
          L'association que vous soutenez reçoit le montant de vos dons et, pour l'établissement du
          reçu fiscal, votre identité — c'est une obligation légale à laquelle elle est tenue.
        </p>
      </Section>

      <Section title="Transferts hors Union européenne">
        <p>
          L'hébergement et la base de données sont localisés dans l'Union européenne. Certains
          prestataires, notamment pour l'envoi des emails, peuvent traiter des données aux
          États-Unis. Ces transferts sont encadrés par les clauses contractuelles types adoptées
          par la Commission européenne, complétées le cas échéant par le cadre de protection des
          données UE–États-Unis.
        </p>
      </Section>

      <Section title="Durées de conservation">
        <p>
          Nous ne gardons vos données que le temps nécessaire. Les durées fiscales et comptables
          diffèrent : lorsqu'un document relève des deux, nous appliquons la plus longue.
        </p>
        <LegalTable
          headers={['Données', 'Durée', 'Motif']}
          rows={CONSERVATION.map((c) => [c.donnees, c.duree, c.motif])}
        />
        <p>
          Au terme de ces durées, les données sont supprimées ou anonymisées de manière
          irréversible.
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous disposez des droits d'accès, de rectification, d'effacement, de limitation,
          d'opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout
          moment et de définir des directives relatives au sort de vos données après votre décès.
        </p>
        <p>
          Deux de ces droits s'exercent directement, sans nous écrire ni attendre : depuis l'onglet{' '}
          <strong>Informations</strong> de votre profil, vous pouvez{' '}
          <strong>exporter toutes vos données</strong> dans un fichier lisible, et{' '}
          <strong>supprimer votre compte</strong>. La suppression efface votre profil, révoque
          l'accès à votre banque et supprime vos informations de paiement.
        </p>
        <p>
          Les dons déjà versés sont conservés de façon anonymisée par les associations
          bénéficiaires : ce sont leurs pièces comptables, et elles sont légalement tenues de les
          garder.
        </p>
        <p>
          Pour tout autre droit, écrivez à{' '}
          <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a>. Nous répondons sous un mois.
        </p>
      </Section>

      <Section title="Réclamation">
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
          réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL),
          3 place de Fontenoy, 75007 Paris —{' '}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            cnil.fr/fr/plaintes
          </a>
          .
        </p>
      </Section>

      <Section title="Sécurité">
        <p>
          Les échanges sont chiffrés en transit. Vos coordonnées bancaires complètes ne transitent
          jamais par nos serveurs et ne sont jamais stockées par nous : elles sont gérées
          directement par Stripe. L'accès aux données est restreint et les opérations sensibles
          sont journalisées.
        </p>
        <p>
          En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits,
          nous vous en informerions dans les meilleurs délais, conformément à l'article 34 du RGPD.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Nous n'utilisons ni cookie publicitaire, ni traceur tiers à des fins de mesure
          d'audience. Seuls sont déposés les cookies strictement nécessaires au fonctionnement du
          service, notamment pour vous maintenir connecté. Ces cookies sont exemptés de
          consentement au titre de l'article 82 de la loi Informatique et Libertés.
        </p>
      </Section>

      <Section title="Modification">
        <p>
          Cette politique peut évoluer. Toute modification substantielle vous sera notifiée par
          email. Les conditions générales sont consultables sur la page{' '}
          <Link href="/cgu">CGU</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
