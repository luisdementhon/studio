import { NextRequest, NextResponse } from 'next/server';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';
import { verifyRna } from '@/lib/rna';

/**
 * Vérification interactive pendant la saisie du formulaire d'inscription.
 *
 * Purement indicative : c'est /api/association/register qui re-vérifie et
 * fait foi au moment de l'enregistrement.
 */
export async function GET(request: NextRequest) {
  // Authentification requise : évite que la route serve de proxy ouvert
  // vers l'API entreprises de l'État.
  try {
    await requireUser(request);
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    throw error;
  }

  const rna = new URL(request.url).searchParams.get('rna');

  if (!rna) {
    return NextResponse.json({ error: 'Le numéro RNA est requis.' }, { status: 400 });
  }

  const result = await verifyRna(rna);

  if (result.valid) {
    return NextResponse.json({ valid: true, association: result.association });
  }

  return NextResponse.json(
    { valid: false, error: result.error },
    result.status ? { status: result.status } : undefined
  );
}
