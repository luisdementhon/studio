import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DotlyLogo } from '@/components/dotly-logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="p-8">
        <Link href="/">
          <DotlyLogo className="w-40 h-auto text-foreground" />
        </Link>
      </header>
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-headline font-bold text-foreground tracking-tight">
          Le don minimaliste.
        </h1>
        <h2 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tight mt-2">
          L'impact maximal.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          À chaque achat par carte, arrondissez à l’euro supérieur et reversez la différence à des associations qui vous tiennent à cœur. Simple, automatique, puissant.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Commencer</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
