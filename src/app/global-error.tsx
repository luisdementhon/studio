"use client";

/**
 * Dernier recours : une erreur survenue dans le layout racine lui-même, que
 * `error.tsx` ne peut pas rattraper puisqu'il vit à l'intérieur de ce layout.
 *
 * Ce composant remplace tout le document : il doit donc porter ses propres
 * balises <html> et <body>, et ne peut dépendre d'aucun style de l'application.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: '1.5rem',
          background: '#FAF9F6',
          color: '#1a1a1a',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            L'application n'a pas pu démarrer
          </h1>
          <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Une erreur inattendue s'est produite. Vos données et vos dons ne sont
            pas affectés.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#999', marginBottom: '1.5rem' }}>
              Référence : {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#FF6B5A',
              color: '#fff',
              border: 'none',
              borderRadius: '1rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
