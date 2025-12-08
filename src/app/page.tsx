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
            <h1 className="text-6xl md:text-8xl from-primary to-accent/80 bg-gradient-to-br bg-clip-text font-bold tracking-tight text-transparent drop-shadow-sm">
              Petite monnaie,<br />
              grands gestes.
            </h1>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <Button asChild size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold px-6 py-6 rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow">
              <Link href="/signup">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/50 hover:bg-white/80 border-border text-foreground text-base font-semibold px-6 py-6 rounded-xl backdrop-blur-sm">
              <Link href="#how-it-works">Comment ça marche ?</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
