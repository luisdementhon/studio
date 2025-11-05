import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DotlyLogo } from '@/components/dotly-logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <DotlyLogo className="w-48 h-auto text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Transformez votre petite monnaie
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
          en grands gestes.
        </h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          À chaque achat par carte, arrondissez à l’euro supérieur et reversez la différence à des associations qui vous tiennent à cœur.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/signup">C'est ma première fois</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login">J'ai déjà un compte</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
