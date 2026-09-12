"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotlyBrand } from '@/components/ui/dotly-brand';
import { Magnetic } from '@/components/ui/magnetic';
import { ShowcaseVideo } from '@/components/ui/showcase-video';
import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    num: '01',
    title: 'Connectez votre banque.',
    desc: 'Connexion Open Banking sécurisée, en 2 minutes. Aucune carte, aucun accès en écriture. Compatible avec toutes les banques françaises.',
    color: 'bg-brand-pink/40',
  },
  {
    num: '02',
    title: 'Choisissez vos causes.',
    desc: 'Sélectionnez vos associations préférées parmi nos partenaires. Toutes vérifiées, toutes en France. Vous pouvez en changer à tout moment.',
    color: 'bg-brand-mint/40',
  },
  {
    num: '03',
    title: 'Ne vous en occupez plus.',
    desc: 'Chaque paiement est arrondi à l\'euro supérieur. Le surplus est versé chaque mois aux associations. Vous recevez un reçu fiscal annuel.',
    color: 'bg-brand-lavender/40',
  },
];

function ScrollStep({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${step.color} rounded-[2.5rem] p-12 space-y-8 transition-all duration-700`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.97)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <span className="text-[6rem] font-extrabold leading-none">{step.num}</span>
      <div className="space-y-4">
        <h3 className="text-3xl font-extrabold tracking-tight">{step.title}</h3>
        <p className="text-foreground/60 font-headline font-light text-base leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);

  const toggleCause = (cause: string) => {
    setSelectedCauses(prev =>
      prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-black/[0.05] fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 group">
          <DotlyBrand className="text-3xl transition-transform group-hover:scale-105" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#comment-ca-marche" className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors nav-link-underline">Comment ça marche</Link>
          <Link href="/login" className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors nav-link-underline">Se connecter</Link>
          <Button asChild size="sm" className="rounded-full bg-black text-white hover:bg-black/80 font-bold px-6 py-5 group">
            <Link href="/signup" className="flex items-center gap-2">
              Commencer <ArrowRight className="w-4 h-4 transition-transform hover-arrow" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="px-8 pt-12 pb-20 max-w-[1400px] mx-auto space-y-12">
          
          {/* Cascade 1: Titre (2 lignes) */}
          <div className="text-left w-full animate-cascade" style={{ animationDelay: '100ms' }}>
            <h1 className="text-6xl md:text-[6.5rem] font-headline font-extrabold tracking-tight leading-[0.9] text-foreground max-w-none">
              Petite monnaie,<br />
              <span className="text-brand-coral font-serif italic font-bold">grands</span> gestes.
            </h1>
          </div>

          {/* Cascade 2: Sous-titre */}
          <div className="text-left w-full animate-cascade" style={{ animationDelay: '250ms' }}>
            <p className="text-lg md:text-xl font-headline font-light text-foreground/60 max-w-2xl leading-relaxed">
              Arrondissez automatiquement vos dépenses quotidiennes à l'euro supérieur et donnez vos centimes aux associations de votre choix en toute simplicité.
            </p>
          </div>

          {/* Cascade 3: Bandeau mécanisme */}
          <div className="w-full bg-white/40 backdrop-blur-sm border border-black/[0.05] rounded-[2.5rem] p-4 flex flex-col md:flex-row md:items-stretch md:justify-between gap-4 animate-cascade" style={{ animationDelay: '400ms' }}>
            {/* Colonne 1: Vous payez */}
            <div className="flex-1 bg-white rounded-3xl p-8 flex flex-col justify-center border border-black/[0.02] shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Vous payez</span>
              <span className="text-4xl md:text-5xl font-extrabold text-foreground mt-3 mb-1">2,80 €</span>
              <span className="text-xs text-muted-foreground font-medium">Un café, ce matin</span>
            </div>
            
            {/* Flèche 1 */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shadow-sm">
                <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
              </div>
            </div>

            {/* Colonne 2: On arrondit */}
            <div className="flex-1 bg-white rounded-3xl p-8 flex flex-col justify-center border border-black/[0.02] shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">On arrondit</span>
              <span className="text-4xl md:text-5xl font-extrabold text-foreground mt-3 mb-1">3,00 €</span>
              <span className="text-xs text-muted-foreground font-medium">à l'euro supérieur</span>
            </div>
            
            {/* Flèche 2 */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shadow-sm">
                <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
              </div>
            </div>

            {/* Colonne 3: La différence */}
            <div className="flex-1 bg-brand-coral/5 rounded-3xl p-8 flex flex-col justify-center border border-brand-coral/10 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-coral/70">La différence</span>
              <span className="text-4xl md:text-5xl font-extrabold text-brand-coral mt-3 mb-1">0,20 €</span>
              <span className="text-xs text-brand-coral/60 font-medium">mise de côté</span>
            </div>
            
            {/* Flèche 3 */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shadow-sm">
                <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
              </div>
            </div>

            {/* Colonne 4: Part à (votre asso de coeur) */}
            <div className="flex-1 bg-neutral-950 rounded-3xl p-8 flex flex-col justify-center shadow-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40">Part à</span>
              <span className="text-3xl md:text-4xl font-serif italic text-brand-coral mt-3 leading-none">votre asso</span>
              <span className="text-3xl md:text-4xl font-extrabold text-white leading-none mt-1">de coeur</span>
            </div>
          </div>

          {/* Cascade 4: Boutons Commencer et Se connecter (Magnétiques !) */}
          <div className="flex flex-wrap justify-center gap-6 pt-4 animate-cascade" style={{ animationDelay: '550ms' }}>
            <Magnetic>
              <Button asChild size="lg" className="rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold px-12 h-16 text-lg shadow-xl shadow-brand-coral/20 group">
                <Link href="/signup" className="flex items-center gap-2">
                  Commencez dès maintenant
                  <ArrowRight className="w-5 h-5 hover-arrow" />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild variant="outline" size="lg" className="rounded-full border-black text-black hover:bg-black hover:text-white font-bold px-12 h-16 text-lg transition-all">
                <Link href="/login">Se connecter</Link>
              </Button>
            </Magnetic>
          </div>

          {/* Cascade 5: Indicateur de défilement en boucle */}
          <div className="hidden md:flex flex-col items-center gap-3 pt-12 animate-cascade" style={{ animationDelay: '700ms' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50">Défiler pour en savoir plus</span>
            <div className="w-[2px] h-12 bg-black/10 relative overflow-hidden rounded-full">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-coral rounded-full animate-scroll-segment" />
            </div>
          </div>

        </section>

        {/* Section: Causes d'associations (Sélection interactive) */}
        <section className="px-8 py-16 max-w-[1400px] mx-auto text-center space-y-8 flex flex-col items-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60">Quelles causes pouvez-vous soutenir ?</span>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {['Environnement', 'Solidarité', 'Santé & Recherche', 'Éducation', 'Protection Animale', 'Aide Humanitaire', 'Inclusion Sociale', 'Patrimoine & Culture'].map(cause => {
              const isSelected = selectedCauses.includes(cause);
              return (
                <button
                  key={cause}
                  onClick={() => toggleCause(cause)}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-brand-coral text-white border border-brand-coral shadow-md scale-105'
                      : 'association-chip border border-black/10 bg-white text-muted-foreground'
                  }`}
                >
                  {cause} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          {selectedCauses.length > 0 && (
            <div className="pt-4 animate-cascade">
              <Magnetic>
                <Button asChild size="lg" className="rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold px-12 h-16 text-lg shadow-xl shadow-brand-coral/20 group">
                  <Link href="/signup" className="flex items-center gap-2">
                    Commencer dès maintenant
                    <ArrowRight className="w-5 h-5 hover-arrow" />
                  </Link>
                </Button>
              </Magnetic>
            </div>
          )}
        </section>

        {/* Section: Trois étapes — scroll animé */}
        <section id="comment-ca-marche" className="px-8 py-32 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <h2 className="text-6xl md:text-[7rem] font-headline font-extrabold tracking-tight leading-[0.85]">
              Trois étapes,<br />
              pas de <span className="text-brand-coral font-serif italic font-bold">frais</span>.
            </h2>
            <p className="text-foreground/60 font-headline font-light text-base md:text-lg max-w-sm">
              <DotlyBrand className="inline text-lg" /> s'installe en deux minutes. Une fois connecté, le service se fait oublier — tout est automatisé.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <ScrollStep key={step.num} step={step} index={i} />
            ))}
          </div>
        </section>

        {/* Section: Démonstration vidéo */}
        <section className="px-8 pb-32 max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60">
                Aperçu du produit
              </span>
              <h2 className="text-6xl md:text-[7rem] font-headline font-extrabold tracking-tight leading-[0.85]">
                Vu de<br />
                l'<span className="text-brand-coral font-serif italic font-bold">intérieur</span>.
              </h2>
            </div>
            <p className="text-foreground/60 font-headline font-light text-base md:text-lg max-w-sm">
              Deux espaces, une même mécanique : le donateur ne s'occupe de rien, l'association
              suit tout.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 md:gap-8">
            <ShowcaseVideo
              src="/videos/dotly-donateur.mp4"
              poster="/videos/dotly-donateur-poster.jpg"
              label="Côté donateur"
              accent="coral"
              title="Vos centimes, sans y penser."
              description="Connexion bancaire, choix des causes, plafond mensuel : tout se règle une fois. Ensuite, chaque achat arrondi alimente votre cagnotte solidaire."
              delay={0}
            />
            <ShowcaseVideo
              src="/videos/dotly-association.mp4"
              poster="/videos/dotly-association-poster.jpg"
              label="Côté association"
              accent="mint"
              title="Vos dons, en clair."
              description="Tableau de bord des collectes, suivi des donateurs, versements et reçus fiscaux réunis au même endroit."
              delay={150}
            />
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 border-t border-black/[0.05] text-center">
        <p className="text-foreground/40 font-headline font-light uppercase tracking-widest text-[10px] flex items-center justify-center gap-1">
          © 2026 <DotlyBrand className="text-[10px] font-bold" /> Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
