import { NextRequest, NextResponse } from 'next/server';
import { requireUser, apiAuthErrorResponse } from '@/lib/api-auth';

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

  const { searchParams } = new URL(request.url);
  const rna = searchParams.get('rna');

  if (!rna) {
    return NextResponse.json({ error: 'Le numéro RNA est requis.' }, { status: 400 });
  }

  // Validate RNA format: W followed by 9 digits
  const rnaRegex = /^W\d{9}$/;
  if (!rnaRegex.test(rna.toUpperCase())) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Format invalide. Le numéro RNA doit commencer par W suivi de 9 chiffres (ex: W751000001).' 
    }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${rna.toUpperCase()}`,
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 } // Cache 24h
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Erreur lors de la vérification. Veuillez réessayer.' 
      }, { status: 502 });
    }

    const data = await response.json();
    
    // Check if we have results and if the RNA matches exactly
    if (!data.results || data.results.length === 0 || data.results[0].complements?.identifiant_association !== rna.toUpperCase()) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Aucune association trouvée avec ce numéro RNA.' 
      });
    }

    const asso = data.results[0];

    return NextResponse.json({
      valid: true,
      association: {
        titre: asso.nom_complet || 'Association vérifiée',
        objet: asso.activite_principale || '',
        adresse_siege: asso.siege?.adresse ? `${asso.siege.adresse} ${asso.siege.code_postal} ${asso.siege.libelle_commune}` : '',
        date_creation: asso.date_creation || '',
      }
    });
  } catch (error) {
    console.error('RNA verification error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Service de vérification indisponible.' 
    }, { status: 503 });
  }
}
