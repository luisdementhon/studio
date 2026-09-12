'use client';

/** Côté du carré produit, en pixels. Suffisant pour un avatar en haute densité. */
const AVATAR_SIZE = 256;
const JPEG_QUALITY = 0.85;

/**
 * Réduit une image à une vignette carrée encodée en JPEG (data URI).
 *
 * Les photos de profil sont stockées dans le document Firestore de
 * l'utilisateur, or un document est limité à 1 Mo — une photo de téléphone
 * encodée en base64 le dépasse largement, et l'écriture échoue. On redimensionne
 * donc avant stockage : une vignette 256×256 pèse quelques dizaines de Ko.
 *
 * Le recadrage est centré, en conservant les proportions.
 */
export async function resizeToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const context = canvas.getContext('2d');
    if (!context) throw new Error("Impossible de préparer l'image.");

    // Recadrage centré : on prend le plus grand carré possible dans la source.
    const side = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - side) / 2;
    const sourceY = (bitmap.height - side) / 2;

    context.drawImage(bitmap, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}
