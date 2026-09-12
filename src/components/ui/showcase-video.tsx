'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

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
    button: 'bg-brand-coral',
  },
  mint: {
    chip: 'bg-brand-mint/10 text-brand-mint',
    dot: 'bg-brand-mint',
    glow: 'shadow-brand-mint/10',
    button: 'bg-brand-mint',
  },
} as const;

/**
 * Vidéo de démonstration, en lecture automatique mais pilotable.
 *
 * Démarre seule à l'entrée dans le viewport et se met en pause à la sortie :
 * inutile de décoder une vidéo que personne ne regarde, et le fichier n'est
 * pas téléchargé à l'ouverture de la page.
 *
 * Une mise en pause manuelle est respectée : on ne relance pas la lecture au
 * scroll suivant, sinon le bouton pause n'aurait aucun effet durable.
 *
 * Respecte `prefers-reduced-motion` : pas de démarrage automatique, contrôles
 * natifs affichés à la place.
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
  const pausedByUser = useRef(false);
  /** La vidéo est visible et devrait jouer, que les données soient prêtes ou non. */
  const shouldPlay = useRef(false);

  const [visible, setVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
          if (pausedByUser.current) return;
          // Avec preload="metadata", la vidéo n'a souvent pas encore assez de
          // données au moment où elle entre dans le viewport : play() est alors
          // rejeté. On mémorise l'intention, et onCanPlay relancera.
          shouldPlay.current = true;
          video.play().catch(() => {});
        } else {
          shouldPlay.current = false;
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      pausedByUser.current = false;
      shouldPlay.current = true;
      video.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      shouldPlay.current = false;
      video.pause();
    }
  }, []);

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
        className={`group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-neutral-950 shadow-2xl ${theme.glow} ring-1 ring-black/[0.04]`}
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          // Rattrapage : la lecture demandée pendant le chargement est relancée
          // dès que le navigateur a de quoi jouer.
          onCanPlay={() => {
            if (shouldPlay.current && !pausedByUser.current) {
              videoRef.current?.play().catch(() => {});
            }
          }}
          onClick={reducedMotion ? undefined : toggle}
          aria-label={`${title} — démonstration`}
        />

        {!reducedMotion && (
          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
            aria-pressed={isPlaying}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              // Quand ça joue, le bouton s'efface et ne réapparaît qu'au survol
              // ou au focus clavier : il ne doit pas masquer la démonstration.
              isPlaying
                ? 'bg-transparent opacity-0 hover:opacity-100 focus-visible:opacity-100'
                : 'bg-black/25 opacity-100'
            }`}
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${theme.button} text-white shadow-2xl transition-transform duration-300 hover:scale-110`}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" fill="currentColor" />
              ) : (
                <Play className="ml-1 h-6 w-6" fill="currentColor" />
              )}
            </span>
          </button>
        )}
      </div>

      <div className="space-y-2 px-1 md:px-2">
        <h3 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight">{title}</h3>
        <p className="text-base md:text-lg font-headline font-light leading-relaxed text-foreground/60 max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}
