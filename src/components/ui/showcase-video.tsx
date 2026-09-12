'use client';

import { useEffect, useRef, useState } from 'react';

interface ShowcaseVideoProps {
  src: string;
  poster?: string;
  /** Libellé affiché au-dessus de la vidéo (ex. "Côté donateur"). */
  label: string;
  /** Couleur d'accent de la pastille de libellé. */
  accent: 'coral' | 'mint';
  title: string;
  description: string;
  /** Décalage de l'animation d'entrée, en ms. */
  delay?: number;
}

const accents = {
  coral: {
    chip: 'bg-brand-coral/10 text-brand-coral',
    dot: 'bg-brand-coral',
    glow: 'shadow-brand-coral/10',
  },
  mint: {
    chip: 'bg-brand-mint/10 text-brand-mint',
    dot: 'bg-brand-mint',
    glow: 'shadow-brand-mint/10',
  },
} as const;

/**
 * Vidéo de démonstration en lecture automatique.
 *
 * Ne démarre que lorsqu'elle entre dans le viewport et se met en pause dès
 * qu'elle en sort : inutile de faire tourner un décodage vidéo sur une section
 * que personne ne regarde, et ça évite de télécharger le fichier à l'ouverture
 * de la page.
 *
 * Respecte `prefers-reduced-motion` : dans ce cas la lecture automatique est
 * désactivée et les contrôles natifs sont affichés.
 */
export function ShowcaseVideo({
  src,
  poster,
  label,
  accent,
  title,
  description,
  delay = 0,
}: ShowcaseVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);

        const video = videoRef.current;
        if (!video || reducedMotion) return;

        if (entry.isIntersecting) {
          // Safari rejette la promesse si la lecture est refusée : on l'absorbe,
          // le poster reste affiché, rien ne casse.
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const theme = accents[accent];

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-6 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] ${theme.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
          {label}
        </span>
      </div>

      <div
        className={`group relative overflow-hidden rounded-[2.5rem] bg-neutral-950 shadow-2xl ${theme.glow} ring-1 ring-black/[0.04] transition-transform duration-500 hover:-translate-y-1`}
      >
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          controls={reducedMotion}
          aria-label={`${title} — démonstration`}
        />
      </div>

      <div className="space-y-2 px-2">
        <h3 className="text-2xl font-headline font-extrabold tracking-tight">{title}</h3>
        <p className="text-base font-headline font-light leading-relaxed text-foreground/60">
          {description}
        </p>
      </div>
    </div>
  );
}
