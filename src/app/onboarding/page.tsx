import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Building2 } from 'lucide-react';
import { User } from 'lucide-react';

export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Bienvenue sur Dotly !
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Pour commencer, dites-nous qui vous êtes.
      </p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
        <Link href="/onboarding/user">
          <Card className="group h-full transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <User className="h-10 w-10" />
              </div>
              <CardTitle className="text-xl">Je suis un particulier</CardTitle>
              <CardDescription className="mt-2 flex items-center justify-center gap-2 text-base">
                Commencer à donner
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/onboarding/association">
          <Card className="group h-full transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
            <CardHeader className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Building2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-xl">Nous sommes une association</CardTitle>
              <CardDescription className="mt-2 flex items-center justify-center gap-2 text-base">
                Recevoir des dons
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
