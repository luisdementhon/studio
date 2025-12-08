
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DotlyLogo } from '@/components/dotly-logo';
import { BrandPattern } from '@/components/brand-pattern';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, ShieldCheck, HandHeart, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <BrandPattern />
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 md:p-8">
        <Link href="/" aria-label="Accueil">
          <DotlyLogo className="h-8 w-auto text-primary" />
        </Link>
        <Button asChild variant="ghost">
          <Link href="/login">Se connecter</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center text-center p-4">
        <div className="z-10 flex flex-col items-center gap-6">
          
          <div className="font-headline">
            <h1 className="pb-4 text-6xl md:text-8xl from-primary to-green-400 bg-gradient-to-br bg-clip-text font-bold tracking-tight text-transparent drop-shadow-sm leading-snug">
              Petite monnaie,<br />
              grands gestes.
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-foreground/80">
            Arrondissez vos dépenses. Amplifiez votre impact. Le moyen le plus simple de soutenir les causes qui comptent pour vous, sans effort.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-base font-semibold px-8 py-7 rounded-xl" variant="default">
              <Link href="/signup">
                Commencez
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
