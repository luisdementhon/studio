"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

import { useToast } from "@/hooks/use-toast";
import { UserOnboardingSchema } from "@/lib/schemas";
import { useFirestore, useUser, setDocumentNonBlocking } from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Link2, CreditCard, User, Heart, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from "lucide-react";
import { StripeWrapper } from "@/components/providers/stripe-wrapper";
import { PaymentMethodSection } from "@/components/profile/payment-method";
import { DotlyBrand } from "@/components/ui/dotly-brand";
import { Magnetic } from "@/components/ui/magnetic";

const causes = [
  { id: 'environnement', label: 'Environnement' },
  { id: 'pauvrete', label: 'Lutte contre la pauvreté' },
  { id: 'sante', label: 'Santé & Recherche' },
  { id: 'education', label: 'Éducation & Jeunesse' },
  { id: 'animaux', label: 'Protection animale' },
  { id: 'culture', label: 'Culture & Patrimoine' },
  { id: 'humanitaire', label: 'Aide humanitaire' },
  { id: 'social', label: 'Inclusion sociale' },
];

export default function UserOnboardingPage() {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const firestore = useFirestore();
  const { user } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    const s = searchParams?.get('step');
    if (s) setStep(parseInt(s));
  }, [searchParams]);

  useEffect(() => {
    if (user && firestore) {
      getDoc(doc(firestore, "users", user.uid)).then(snap => {
        if (snap.exists()) setDbUser(snap.data());
      });
    }
  }, [user, firestore, step]);

  const form = useForm<z.infer<typeof UserOnboardingSchema>>({
    resolver: zodResolver(UserOnboardingSchema),
    defaultValues: {
      fullName: "",
      causes: [],
      associations: [],
      donationCeiling: 50,
      donationMultiplier: 1,
      otherCause: "",
    },
  });

  const watchedCauses = form.watch("causes", []);

  function onProfileSubmit(values: z.infer<typeof UserOnboardingSchema>) {
    if (!user || !firestore) {
      toast({ title: "Erreur", description: "Vous devez être connecté.", variant: "destructive" });
      return;
    }

    startTransition(() => {
      const { fullName, ...preferences } = values;
      const [firstName, ...lastNameParts] = (fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');

      const userProfile = {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        ...preferences,
      };
      
      const userDocRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      setStep(2);
    });
  }

  const handleConnectBank = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/bridge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, userId: user?.uid, onboarding: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de connexion à l'API");
      }

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Impossible de générer l'URL de connexion.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <StripeWrapper>
      <div className="mx-auto max-w-2xl space-y-8 pb-12">
        {/* Progress Header */}
        <div className="text-center space-y-4 animate-cascade" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-all duration-500 ${
                  step >= s ? 'bg-brand-coral' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight">
            {step === 1 && <><DotlyBrand /> et vous</>}
            {step === 2 && "L'arrondi automatique"}
            {step === 3 && "Le don sécurisé"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            {step === 1 && "Dites-nous quelles causes vous tiennent à cœur."}
            {step === 2 && "Connectez votre banque pour activer les arrondis."}
            {step === 3 && "Enregistrez votre carte pour valider vos dons."}
          </p>
        </div>

        {step === 1 && (
          <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] animate-cascade" style={{ animationDelay: '250ms' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-8 pt-8">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre prénom et nom" className="h-12 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="causes"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Vos causes favorites</FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {causes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="causes"
                              render={({ field }) => (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isChecked = field.value?.includes(item.id);
                                    return isChecked
                                      ? field.onChange(field.value?.filter((v) => v !== item.id))
                                      : field.onChange([...(field.value ?? []), item.id]);
                                  }}
                                  className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border-2 text-sm font-bold transition-all association-chip ${
                                    field.value?.includes(item.id)
                                      ? 'border-brand-coral bg-brand-coral/5 text-brand-coral shadow-lg shadow-brand-coral/5'
                                      : 'border-muted bg-muted/20 text-muted-foreground hover:border-brand-coral/20'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              )}
                            />
                          ))}
                          
                          <FormField
                            key="autre"
                            control={form.control}
                            name="causes"
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => {
                                  const isChecked = field.value?.includes("autre");
                                  return isChecked
                                    ? field.onChange(field.value?.filter((v) => v !== "autre"))
                                    : field.onChange([...(field.value ?? []), "autre"]);
                                }}
                                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl border-2 text-sm font-bold transition-all association-chip ${
                                  field.value?.includes("autre")
                                    ? 'border-brand-coral bg-brand-coral/5 text-brand-coral shadow-lg shadow-brand-coral/5'
                                    : 'border-muted bg-muted/20 text-muted-foreground hover:border-brand-coral/20'
                                }`}
                              >
                                Autre cause...
                              </button>
                            )}
                          />
                        </div>

                        {watchedCauses.includes('autre') && (
                          <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                            <FormField
                              control={form.control}
                              name="otherCause"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-12 rounded-xl border-brand-coral/20 focus-visible:ring-brand-coral" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                    <div className="space-y-12 pt-4">
                      <FormField
                        control={form.control}
                        name="donationMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-2">
                              <FormLabel className="text-base font-semibold">Multiplicateur : x{field.value}</FormLabel>
                              <span className="text-xs font-bold text-brand-coral bg-brand-coral/10 px-3 py-1 rounded-full">
                                  Env. {(field.value * 12.5).toFixed(2)}€ / mois
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={10}
                                step={0.5}
                                value={[field.value ?? 1]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <p className="text-[10px] text-muted-foreground italic leading-tight">
                              * Basé sur une moyenne de 25 transactions par mois (0,50€ d'arrondi moyen).
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="donationCeiling"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-end mb-2">
                              <FormLabel className="text-base font-semibold">Plafond mensuel</FormLabel>
                              <span className="text-2xl font-bold text-brand-coral">{field.value}€</span>
                            </div>
                            <FormControl>
                              <Slider 
                                min={5} 
                                max={200} 
                                step={5} 
                                value={[field.value ?? 50]} 
                                onValueChange={(v) => field.onChange(v[0])} 
                              />
                            </FormControl>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-2">Minimum 5€</p>
                          </FormItem>
                        )}
                      />
                    </div>
                </CardContent>
                <CardFooter className="p-8 flex justify-center">
                  <Magnetic>
                    <Button type="submit" className="w-full min-w-[300px] h-14 rounded-2xl text-lg font-bold group" variant="vibrant">
                      Continuer <ChevronRight className="ml-2 h-5 w-5 hover-arrow" />
                    </Button>
                  </Magnetic>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] p-12 text-center space-y-8 animate-cascade" style={{ animationDelay: '250ms' }}>
            <div className="mx-auto h-20 w-20 rounded-[2rem] bg-brand-mint/10 flex items-center justify-center">
              <Link2 className="h-10 w-10 text-brand-mint" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Lier votre compte</h2>
              <p className="text-muted-foreground">
                C'est ici que la magie opère. Nous calculons vos arrondis en toute sécurité sans jamais toucher à votre argent.
              </p>
            </div>

            {dbUser?.bankConnected ? (
              <div className="bg-brand-mint/10 rounded-2xl p-6 flex items-center gap-4 text-left border border-brand-mint/20">
                <CheckCircle2 className="h-6 w-6 text-brand-mint" />
                <p className="font-bold">Banque connectée avec succès !</p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Magnetic>
                  <Button onClick={handleConnectBank} disabled={isConnecting} className="w-full min-w-[300px] h-16 rounded-2xl text-lg font-bold" variant="vibrant">
                    {isConnecting ? "Connexion..." : "Connecter ma banque"}
                  </Button>
                </Magnetic>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl max-w-[150px]">
                <ChevronLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl max-w-[150px]">
                Plus tard <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] p-8 animate-cascade" style={{ animationDelay: '250ms' }}>
            <div className="flex flex-col items-center text-center gap-6 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-brand-coral" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Moyen de prélèvement</h2>
                <p className="text-muted-foreground">Enregistrez votre carte pour valider vos dons mensuels.</p>
              </div>
            </div>

            <PaymentMethodSection />

            <div className="mt-12 flex flex-col gap-4 items-center">
              <Magnetic>
                <Button asChild className="w-full min-w-[300px] h-16 rounded-2xl text-lg font-bold" variant="vibrant">
                  <Link href="/dashboard/user">Accéder à mon tableau de bord</Link>
                </Button>
              </Magnetic>
              <Button variant="ghost" onClick={() => setStep(2)} className="h-12 rounded-xl">
                <ChevronLeft className="mr-2 h-4 w-4" /> Étape précédente
              </Button>
            </div>
          </Card>
        )}
      </div>
    </StripeWrapper>
  );
}
