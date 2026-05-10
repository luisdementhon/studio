import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Building2, User } from 'lucide-react';
import { DotlyBrand } from '@/components/ui/dotly-brand';

export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-foreground sm:text-7xl">
        Bienvenue sur <DotlyBrand className="text-brand-coral" />
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-muted-foreground font-headline font-light">
        Pour commencer, dites-nous qui vous êtes.
      </p>

      <div className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-8 md:grid-cols-2 px-4">
        <Link href="/onboarding/user">
          <Card className="group h-full rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-black/[0.06] overflow-hidden">
            <CardHeader className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-6 rounded-3xl bg-brand-coral/10 p-5 text-brand-coral">
                <User className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">Je suis un particulier</CardTitle>
              <CardDescription className="mt-4 flex items-center justify-center gap-2 text-lg font-headline font-light text-muted-foreground">
                Commencer à donner
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/onboarding/association">
          <Card className="group h-full rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-black/[0.06] overflow-hidden">
            <CardHeader className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-6 rounded-3xl bg-brand-mint/10 p-5 text-brand-mint">
                <Building2 className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">Nous sommes une association</CardTitle>
              <CardDescription className="mt-4 flex items-center justify-center gap-2 text-lg font-headline font-light text-muted-foreground">
                Recevoir des dons
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
