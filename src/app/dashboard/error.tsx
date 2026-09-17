"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Frontière d'erreur du tableau de bord.
 *
 * Sans elle, une exception levée dans n'importe quelle page du dashboard
 * remontait jusqu'à `app/error.tsx` — hors du layout — et faisait disparaître
 * la barre latérale avec le reste : l'utilisateur perdait toute navigation et
 * n'avait plus qu'un écran d'erreur plein cadre.
 *
 * Placée ici, elle s'affiche À L'INTÉRIEUR du layout : le menu reste là, et
 * seul le contenu de la page est remplacé.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur du tableau de bord :', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-brand-coral" />
        </div>

        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Cette page n'a pas pu s'afficher
        </h1>

        <p className="text-muted-foreground font-medium">
          Vos données et vos dons ne sont pas affectés. Vous pouvez réessayer,
          ou passer à une autre section depuis le menu.
        </p>

        {/* L'identifiant technique seulement : le détail de l'erreur peut
            contenir des informations internes. */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Référence : {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <Button onClick={reset} className="rounded-2xl h-12 px-8 font-bold">
            Réessayer
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-bold">
            <Link href="/dashboard/user">Mes dons</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
