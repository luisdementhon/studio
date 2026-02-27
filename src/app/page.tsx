"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandPattern } from '@/components/brand-pattern';
import { ArrowRight, Link2, ShoppingCart, HeartHandshake, Building2, ShieldCheck, PiggyBank } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DotlyLogo } from '@/components/dotly-logo';

export default function Home() {
  return (
    <div className="relative flex flex-col bg-background">
      <BrandPattern />
      <main className="flex min-h-[85vh] flex-col items-center justify-center text-center p-4 pt-12">
        <div className="z-10 flex flex-col items-center gap-6">
          <Link href="/" aria-label="Accueil" className="mb-4 flex justify-center">
              <DotlyLogo className="h-auto w-48 text-foreground" />
          </Link>
          
          <div className="font-headline">
            <h1 className="pb-4 text-4xl md:text-6xl font-bold weapons-center tracking-tight text-foreground leading-snug [text-shadow:0_2px_4px_rgba(0,0,0,0.1),0_-1px_0px_rgba(255,255,255,0.2)] text-center">
              Petite monnaie,<br />
              grands gestes.
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-foreground/80 mx-auto">
            Dotly arrondit automatiquement vos paiements à l'euro supérieur et transforme ces centimes en dons pour les causes qui vous sont chères.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-4">
            <Button 
              asChild
              size="lg" 
              className="text-base font-semibold px-8 py-7 rounded-xl from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110" 
              variant="vibrant"
            >
              <Link href="/signup">
                Commencez
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
             <p className="text-base text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 transition-all">
                    Se connecter
                </Link>
            </p>
          </div>
        </div>
      </main>

      <section id="how-it-works" className="w-full py-20 lg:py-32 bg-background/50 z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold sm:text-4xl font-headline text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Comment ça marche ?</h2>
            </div>
          </div>
          <div className="mx-auto max-w-5xl mt-12">
            <Tabs defaultValue="donateur" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="donateur" className="text-base">Pour les donateurs</TabsTrigger>
                <TabsTrigger value="association" className="text-base">Pour les associations</TabsTrigger>
              </TabsList>
              <div className="mt-10">
                <TabsContent value="donateur">
                  <div className="grid gap-8 md:grid-cols-3">
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><Link2 className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Connectez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">Liez votre compte bancaire en quelques clics. Vos données sont chiffrées et protégées.</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><ShoppingCart className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Dépensez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">Nous arrondissons automatiquement chaque paiement à l'euro supérieur, sans que vous ayez à y penser.</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><HeartHandshake className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Soutenez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">La somme de vos arrondis est reversée aux associations que vous avez choisies. Suivez votre impact en temps réel.</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="association">
                  <div className="grid gap-8 md:grid-cols-3">
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><Building2 className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Créez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">Créez le profil de votre association en quelques minutes. Présentez votre mission.</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Validez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">Notre équipe vérifie vos informations pour garantir la confiance et la transparence de la plateforme.</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card className="text-left">
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-lg"><PiggyBank className="w-6 h-6" /></div>
                          <CardTitle className="font-semibold tracking-tight text-xl whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Recevez</CardTitle>
                        </div>
                        <CardDescription className="text-muted-foreground pt-4 text-base">Recevez un flux de micro-dons régulier et automatique. Suivez vos collectes depuis votre tableau de bord.</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
