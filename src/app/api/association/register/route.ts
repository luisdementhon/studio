import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { AssociationOnboardingSchema } from '@/lib/schemas';
import { verifyRna } from '@/lib/rna';

/**
 * Enregistre le profil d'une association, après re-vérification du RNA.
 *
 * L'écriture passe obligatoirement par ici : tant que le formulaire écrivait
 * directement dans Firestore, le contrôle du RNA n'était qu'un garde-fou de
 * navigateur, contournable en appelant le SDK. C'est cette route qui rend
 * vraie la promesse « associations vérifiées » affichée sur le site.
 */
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    const associationId = decoded.uid;

    const parsed = AssociationOnboardingSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { stripeAccountId, ...profile } = parsed.data;

    const rnaResult = await verifyRna(profile.rnaNumber);

    if (!rnaResult.valid) {
      return NextResponse.json({ error: rnaResult.error }, { status: 400 });
    }

    await db
      .collection('associations')
      .doc(associationId)
      .set(
        {
          ...profile,
          id: associationId,
          rnaNumber: profile.rnaNumber.trim().toUpperCase(),
          // Nom officiel tel que retourné par l'annuaire : ce qui est affiché
          // comme « vérifié » doit correspondre à ce qui a été vérifié.
          officialName: rnaResult.association.titre,
          rnaVerified: true,
          rnaVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true, association: rnaResult.association });
  } catch (error: any) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;

    console.error("Erreur d'enregistrement de l'association:", error);
    return NextResponse.json({ error: "L'enregistrement a échoué." }, { status: 500 });
  }
}
