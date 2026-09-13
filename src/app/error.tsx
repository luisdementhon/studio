"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Filet de sécurité d'exécution.
 *
 * Sans ce fichier, la moindre exception non rattrapée dans un composant
 * client laissait l'écran entièrement blanc en production — sans message,
 * sans bouton, sans issue. Next.js affiche ce composant à la place.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erreur non rattrapée :', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-brand-coral" />
        </div>

        <h1 className="text-4xl font-headline font-bold tracking-tight">
          Quelque chose s'est mal passé
        </h1>

        <p className="text-muted-foreground font-medium">
          Cette page n'a pas pu s'afficher. Vos données et vos dons ne sont pas
          affectés. Réessayez, ou revenez à votre tableau de bord.
        </p>

        {/* L'identifiant technique, utile au support, jamais le détail de
            l'erreur : il peut contenir des informations internes. */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono">
            Référence : {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={reset} className="rounded-2xl h-12 px-8 font-bold">
            Réessayer
          </Button>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-bold">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
