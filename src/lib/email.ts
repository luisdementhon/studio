import { Resend } from 'resend';

/**
 * Emails transactionnels, envoyés exclusivement depuis le serveur
 * (webhooks et jobs cron). Jamais depuis le client : la clé API ne doit
 * pas quitter le serveur, et un email « votre don a été prélevé » ne doit
 * partir que si le prélèvement a réellement eu lieu.
 *
 * Les envois ne doivent jamais faire échouer l'opération métier qui les
 * déclenche : un webhook Stripe qui renvoie 500 parce qu'un email n'est
 * pas parti serait rejoué par Stripe, et le don recompté. Toutes les
 * fonctions d'envoi absorbent donc leurs erreurs et se contentent de les
 * journaliser.
 */

const FROM = process.env.EMAIL_FROM || 'dotly <bonjour@dotly-app.fr>';

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY absente : email non envoyé.');
    return null;
  }
  return new Resend(apiKey);
}

const euros = (amount: number) =>
  amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

/** Gabarit commun, pour que tous les emails se ressemblent. */
function layout(title: string, body: string, cta?: { label: string; url: string }): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#1a1a1a">
    <div style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-bottom:32px">dotly<span style="color:#FF6B5B">.</span></div>
    <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px">${title}</h1>
    <div style="font-size:15px;line-height:1.6;color:#4a4a4a">${body}</div>
    ${
      cta
        ? `<a href="${cta.url}" style="display:inline-block;margin-top:28px;background:#FF6B5B;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px">${cta.label}</a>`
        : ''
    }
    <p style="margin-top:40px;font-size:12px;color:#9a9a9a">dotly — vos centimes, leurs grandes causes.</p>
  </div>`;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const client = getClient();
  if (!client || !to) return;

  try {
    await client.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error(`Échec de l'envoi de l'email « ${subject} » à ${to}:`, error);
  }
}

export async function sendWelcomeEmail(to: string, firstName?: string) {
  await send(
    to,
    'Bienvenue sur dotly',
    layout(
      `Bienvenue${firstName ? ` ${firstName}` : ''} 👋`,
      `<p>Votre compte dotly est créé. Il reste deux étapes pour que vos centimes se mettent à travailler : connecter votre banque et choisir vos associations.</p>`,
      { label: 'Terminer mon inscription', url: 'https://dotly-app.fr/onboarding/user' }
    )
  );
}

export async function sendMandateConfirmedEmail(to: string, ceiling: number, cardLast4?: string | null) {
  await send(
    to,
    'Votre mandat dotly est actif',
    layout(
      'Tout est prêt',
      `<p>Votre moyen de paiement${cardLast4 ? ` (carte ••••${cardLast4})` : ''} est enregistré.</p>
       <p>Chaque mois, dotly prélèvera en une fois le cumul de vos arrondis, <strong>dans la limite de ${euros(ceiling)}</strong>. Ce plafond ne sera jamais dépassé.</p>
       <p>Vous n'avez plus rien à faire.</p>`
    )
  );
}

export async function sendMonthlyRecapEmail(
  to: string,
  params: { amount: number; associationName: string; period: string; roundupCount: number }
) {
  await send(
    to,
    `Vos arrondis de ${params.period} sont partis`,
    layout(
      `${euros(params.amount)} pour ${params.associationName}`,
      `<p>Ce mois-ci, <strong>${params.roundupCount} arrondis</strong> se sont transformés en un don de ${euros(params.amount)} pour ${params.associationName}.</p>
       <p>Des centimes que vous n'auriez pas vus passer.</p>`,
      { label: 'Voir mon impact', url: 'https://dotly-app.fr/dashboard/user' }
    )
  );
}

export async function sendPaymentFailedEmail(to: string, reason: string, needsReauth: boolean) {
  await send(
    to,
    'Votre prélèvement dotly n\'a pas abouti',
    layout(
      'Un petit souci de paiement',
      `<p>Nous n'avons pas pu prélever vos arrondis ce mois-ci.</p>
       <p style="color:#9a9a9a">Motif : ${reason}</p>
       <p>${
         needsReauth
           ? 'Votre banque demande une nouvelle validation : il suffit de réenregistrer votre carte.'
           : 'Vos arrondis sont conservés et seront prélevés le mois prochain.'
       }</p>`,
      needsReauth
        ? { label: 'Mettre à jour ma carte', url: 'https://dotly-app.fr/dashboard/user/profile' }
        : undefined
    )
  );
}

export async function sendTaxReceiptEmail(
  to: string,
  params: { year: number; totalAmount: number; associationName: string }
) {
  await send(
    to,
    `Votre reçu fiscal ${params.year}`,
    layout(
      `Reçu fiscal ${params.year}`,
      `<p>En ${params.year}, vous avez donné <strong>${euros(params.totalAmount)}</strong> à ${params.associationName} via dotly.</p>
       <p>Votre reçu fiscal cumulé est disponible dans votre espace. Ce don ouvre droit à une réduction d'impôt de 66 % de son montant.</p>`,
      { label: 'Télécharger mon reçu', url: 'https://dotly-app.fr/dashboard/user' }
    )
  );
}
