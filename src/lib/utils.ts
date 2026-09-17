import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDate, type FormatOptions } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise en Date une valeur temporelle venue de Firestore.
 *
 * Les documents mélangent trois représentations selon leur producteur :
 * Timestamp Firestore (`.toDate()`), Date JS, et string ISO (héritage de
 * webhooks qui écrivaient `new Date().toISOString()`). Appeler `.toDate()`
 * à l'aveugle plante sur les deux dernières.
 *
 * @returns la Date correspondante, ou `fallback` si la valeur est absente
 *          ou invalide.
 */
export function toDate(raw: unknown, fallback: Date = new Date()): Date {
  if (!raw) return fallback;

  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? fallback : raw;
  }

  // Timestamp Firestore (client ou Admin SDK)
  if (typeof (raw as { toDate?: unknown }).toDate === 'function') {
    const converted = (raw as { toDate: () => Date }).toDate();
    return isNaN(converted.getTime()) ? fallback : converted;
  }

  if (typeof raw === 'string' || typeof raw === 'number') {
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  }

  return fallback;
}

/**
 * Formate une date sans jamais lever d'exception.
 *
 * `format()` de date-fns lève « Invalid time value » sur une date invalide —
 * et comme il est appelé en plein rendu, cette exception remonte jusqu'à la
 * frontière d'erreur et emporte toute la page. Un champ `transactionDate`
 * absent d'un seul document suffisait donc à vider un tableau de bord entier.
 *
 * Ce helper existait déjà, dupliqué dans deux pages. Il est ici pour que
 * toute nouvelle page parte du bon comportement plutôt que du dangereux.
 */
export function safeFormat(
  raw: unknown,
  formatStr: string,
  options?: FormatOptions,
  fallback = '—'
): string {
  try {
    const d = toDate(raw, new Date(NaN));
    if (isNaN(d.getTime())) return fallback;
    return formatDate(d, formatStr, options);
  } catch {
    return fallback;
  }
}

/**
 * Première lettre d'un libellé, pour les pastilles d'avatar.
 *
 * C'est le `.charAt(0)` sur un nom absent qui a mis le tableau de bord
 * donateur à blanc : une association créée par l'onboarding Stripe n'avait
 * que ses champs de paiement, pas de nom.
 */
export function initial(value: unknown, fallback = '?'): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.charAt(0).toUpperCase() : fallback;
}

/** Libellé toujours affichable, quel que soit l'état du document source. */
export function safeText(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
}

/** Montant en euros, robuste aux `undefined`, `null` et chaînes numériques. */
export function formatEuros(value: unknown, options?: Intl.NumberFormatOptions): string {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    ...options,
  });
}
