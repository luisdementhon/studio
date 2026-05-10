"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DotlyBrand } from '@/components/ui/dotly-brand';
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

function AnimatedWord({ word, delay = 0 }: { word: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      ref={ref}
      className="inline-block transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
      }}
    >
      {word}
    </span>
  );
}

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
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-black/[0.05] fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 group">
          <DotlyBrand className="text-3xl transition-transform group-hover:scale-105" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#comment-ca-marche" className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors">Comment ça marche</Link>
          <Link href="/login" className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors">Se connecter</Link>
          <Button asChild size="sm" className="rounded-full bg-black text-white hover:bg-black/80 font-bold px-6 py-5 group">
            <Link href="/signup" className="flex items-center gap-2">
              Commencer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pt-20">
        {/* Hero — plein écran, flex-col pour séparer contenu et logo */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col justify-between px-8 overflow-hidden">

          {/* Contenu principal — centré en haut */}
          <div className="flex flex-col items-center text-center space-y-8 pt-16 md:pt-20">
            <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tight leading-[0.95] text-foreground">
              Petite monnaie,<br />
              <span className="text-brand-coral font-serif italic font-bold">grands</span> gestes.
            </h1>

            <p className="text-base md:text-lg font-headline font-light text-foreground/60 max-w-2xl mx-auto leading-relaxed">
              <DotlyBrand className="inline text-2xl" /> arrondit automatiquement vos paiements à l'euro supérieur et transforme ces centimes en dons pour les causes qui vous sont chères.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-2">
              <Button asChild size="lg" className="rounded-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold px-12 h-16 text-lg shadow-xl shadow-brand-coral/20">
                <Link href="/signup">Commencez dès maintenant</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-black text-black hover:bg-black hover:text-white font-bold px-12 h-16 text-lg transition-all">
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>

          {/* DOTLY Géant — dans le flux, aligné en bas à gauche */}
          <div className="select-none pointer-events-none pb-6 pl-4">
            <span
              className="font-headline font-black block whitespace-nowrap"
              style={{
                fontSize: 'clamp(80px, 12vw, 170px)',
                letterSpacing: '-0.05em',
                lineHeight: '1',
                color: 'black',
              }}
            >
              dotly<span className="text-brand-coral">.</span>
            </span>
          </div>

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
      </main>

      <footer className="px-8 py-12 border-t border-black/[0.05] text-center">
        <p className="text-foreground/40 font-headline font-light uppercase tracking-widest text-[10px] flex items-center justify-center gap-1">
          © 2026 <DotlyBrand className="text-[10px] font-bold" /> Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
