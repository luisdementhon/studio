import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
