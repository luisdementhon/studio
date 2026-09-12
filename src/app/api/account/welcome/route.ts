import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { sendWelcomeEmail } from '@/lib/email';

/** À incrémenter à chaque révision des CGU : les consentements passés
 *  restent horodatés avec la version qu'ils ont réellement acceptée. */
const CONSENT_VERSION = '2026-09-01';

/**
 * Envoie l'email de bienvenue, une seule fois par compte.
 *
 * Appelée après la création du compte. L'envoi est gardé par un drapeau en
 * base : un rechargement de page ou un double appel ne renvoie pas l'email.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const userRef = db.collection('users').doc(decoded.uid);

    // Transaction : deux appels concurrents ne doivent produire qu'un envoi.
    const shouldSend = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (snap.data()?.welcomeEmailSentAt) return false;

      tx.set(
        userRef,
        {
          // `id` et `email` sont indispensables : les règles Firestore
          // comparent `id` à chaque écriture cliente, et ce document est créé
          // ici avant tout passage par l'onboarding. Sans eux, l'utilisateur
          // ne pourrait plus rien enregistrer dans son profil.
          id: decoded.uid,
          email: decoded.email ?? null,
          welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          // Trace du consentement : date et version des conditions acceptées
          // au moment de la création du compte (RGPD, preuve du consentement).
          consentedAt: admin.firestore.FieldValue.serverTimestamp(),
          consentVersion: CONSENT_VERSION,
        },
        { merge: true }
      );
      return true;
    });

    if (!shouldSend) {
      return NextResponse.json({ sent: false, reason: 'already_sent' });
    }

    const snap = await userRef.get();
    const email = decoded.email || snap.data()?.email;

    if (email) {
      await sendWelcomeEmail(email, snap.data()?.firstName);
    }

    return NextResponse.json({ sent: Boolean(email) });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Échec de l'email de bienvenue:", error);
    // Un email de bienvenue raté ne doit pas bloquer une inscription.
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}
