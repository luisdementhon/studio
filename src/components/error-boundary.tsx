"use client";

import { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

/**
 * Frontière d'erreur locale.
 *
 * Next.js ne fournit de frontières qu'au niveau des segments de route : une
 * exception levée par n'importe quel composant remonte jusque-là et remplace
 * TOUTE la page. Un seul document Firestore incomplet — une association sans
 * nom, un don sans date — suffisait donc à mettre à blanc un tableau de bord
 * entier, y compris les chiffres parfaitement valides affichés à côté.
 *
 * Ce composant isole une section : si son contenu plante, lui seul affiche un
 * message, et le reste de la page continue de vivre.
 */

type Props = {
  children: ReactNode;
  /** Ce qu'on affiche à la place. Par défaut : l'encart compact ci-dessous. */
  fallback?: ReactNode;
  /** Nom de la section, pour retrouver l'origine dans les logs. */
  label?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ''}]`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div className="rounded-[2rem] border border-brand-coral/15 bg-brand-coral/[0.04] p-8 flex flex-col items-center text-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-brand-coral" />
        </div>
        <p className="font-bold text-foreground/80">
          Cette section n'a pas pu s'afficher
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Le reste de la page reste utilisable. Vos données et vos dons ne sont
          pas affectés.
        </p>
        <button
          onClick={this.reset}
          className="mt-1 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-brand-coral hover:opacity-70 transition-opacity"
        >
          <RotateCw className="h-3 w-3" />
          Réessayer
        </button>
      </div>
    );
  }
}

/**
 * Enveloppe une section indépendante du tableau de bord.
 *
 * `key={label}` n'est pas utilisé volontairement : on veut que la section
 * garde son état entre deux rendus, et qu'elle ne se réinitialise que sur un
 * clic explicite de « Réessayer ».
 */
export function SafeSection({ children, label, fallback }: Props) {
  return (
    <ErrorBoundary label={label} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
