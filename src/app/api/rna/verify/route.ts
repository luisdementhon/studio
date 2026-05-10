import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
      `https://entreprise.data.gouv.fr/api/rna/v1/id/${rna.toUpperCase()}`,
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 } // Cache 24h
      }
    );

    if (response.status === 404) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Aucune association trouvée avec ce numéro RNA.' 
      });
    }

    if (!response.ok) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Erreur lors de la vérification. Veuillez réessayer.' 
      }, { status: 502 });
    }

    const data = await response.json();
    const asso = data.association;

    return NextResponse.json({
      valid: true,
      association: {
        titre: asso?.titre || asso?.titre_court || 'Association vérifiée',
        objet: asso?.objet || '',
        adresse_siege: asso?.adresse_siege || '',
        date_creation: asso?.date_creation || '',
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
