import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { DotlyLogo } from '@/components/dotly-logo';
import { BrandPattern } from '@/components/brand-pattern';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <BrandPattern />
      <header className="p-8 flex justify-start">
        <Link href="/">
          <DotlyLogo className="w-40 h-auto text-primary" />
        </Link>
      </header>
      <div className="flex-grow flex items-center justify-center text-center px-4">
        <div className="flex flex-col items-center">
          <div className="font-headline">
            <h1 className="text-5xl md:text-7xl text-foreground tracking-tight italic">
              Petite monnaie,
            </h1>
            <h2 className="text-5xl md:text-7xl font-bold text-primary tracking-tight mt-2">
              grands gestes.
            </h2>
          </div>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            À chaque achat par carte, arrondissez à l’euro supérieur et reversez la différence à des associations qui vous tiennent à cœur. Simple, automatique, puissant.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" variant="vibrant">
              <Link href="/signup">Commencer</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
