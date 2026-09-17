"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Frontière d'erreur de l'inscription.
 *
 * C'est l'endroit où une erreur coûte le plus cher : un écran blanc pendant
 * l'onboarding, et le compte reste à moitié configuré — sans banque, sans
 * mandat ou sans bénéficiaire, donc sans le moindre arrondi collecté ensuite.
 * On garde donc toujours une porte de sortie visible.
 */
export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur pendant l'inscription :", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-brand-coral" />
        </div>

        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Cette étape n'a pas pu s'afficher
        </h1>

        <p className="text-muted-foreground font-medium">
          Rien de ce que vous avez déjà renseigné n'est perdu. Réessayez pour
          reprendre là où vous en étiez.
        </p>

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
            <Link href="/dashboard">Mon tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
