"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { AssociationOnboardingSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";


import { useFirestore, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { authedFetch } from "@/lib/api-client";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssociationOnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<z.infer<typeof AssociationOnboardingSchema>>({
    resolver: zodResolver(AssociationOnboardingSchema),
    defaultValues: {
      associationName: "",
      representativeName: "",
      contactEmail: "",
      rnaNumber: "",
      description: "",
      fundraisingGoal: 1000,
      currentMissions: "",
    },
  });

  const [rnaStatus, setRnaStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [rnaAssociationName, setRnaAssociationName] = useState<string>('');
  const [rnaError, setRnaError] = useState<string>('');

  const verifyRna = useCallback(async (rnaNumber: string) => {
    if (!rnaNumber || rnaNumber.length < 10) {
      setRnaStatus('idle');
      setRnaAssociationName('');
      setRnaError('');
      return;
    }

    setRnaStatus('checking');
    setRnaError('');
    setRnaAssociationName('');

    try {
      const response = await authedFetch(`/api/rna/verify?rna=${encodeURIComponent(rnaNumber)}`);
      const data = await response.json();

      if (data.valid) {
        setRnaStatus('valid');
        setRnaAssociationName(data.association.titre);
        // Auto-fill the association name if empty
        if (!form.getValues('associationName') && data.association.titre) {
          form.setValue('associationName', data.association.titre);
        }
      } else {
        setRnaStatus('invalid');
        setRnaError(data.error || 'Numéro RNA non reconnu.');
      }
    } catch (error) {
      setRnaStatus('invalid');
      setRnaError('Impossible de vérifier le RNA. Réessayez.');
    }
  }, [form]);
  function onSubmit(values: z.infer<typeof AssociationOnboardingSchema>) {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté pour créer une association.", variant: "destructive" });
      return;
    }
    if (rnaStatus !== 'valid') {
      toast({ title: "Vérification requise", description: "Veuillez entrer un numéro RNA valide et vérifié.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        // L'enregistrement passe par le serveur, qui re-vérifie le RNA :
        // le contrôle ci-dessus n'est qu'une aide à la saisie.
        const response = await authedFetch("/api/association/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "L'enregistrement a échoué.");
        }

        toast({ title: "Profil complété !", description: "Les informations de votre association ont été enregistrées." });
        router.push("/dashboard/association");
      } catch (error: any) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Premium Header */}
      <div className="text-center space-y-2 pb-4">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-mint bg-brand-mint/20 px-3 py-1 rounded-full">
          Espace Association
        </span>
        <h1 className="text-4xl font-bold tracking-tight mt-3">Profil de votre association</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Fournissez ces informations pour que nous puissions vérifier votre association et commencer à recevoir des dons.
        </p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="associationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Nom de l'association</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'association" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Nom du représentant</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du représentant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Email de contact</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@association.fr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rnaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Numéro RNA</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            placeholder="W123456789" 
                            {...field} 
                            onBlur={(e) => {
                              field.onBlur();
                              verifyRna(e.target.value);
                            }}
                            className={`pr-10 ${
                              rnaStatus === 'valid' ? 'border-green-500 focus-visible:ring-green-500' :
                              rnaStatus === 'invalid' ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                          />
                        </FormControl>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {rnaStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {rnaStatus === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {rnaStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      {rnaStatus === 'valid' && rnaAssociationName && (
                        <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" /> {rnaAssociationName}
                        </p>
                      )}
                      {rnaStatus === 'invalid' && rnaError && (
                        <p className="text-sm text-red-500 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {rnaError}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Description de l'association</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez la mission et les activités de votre association..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fundraisingGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Objectif de collecte annuel (€)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentMissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Missions à financer (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Financer 1000 repas chauds, construire un refuge..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col gap-3 pb-6">
              <Button type="submit" disabled={isPending || !user} className="w-full" variant="vibrant" size="lg">
                {isPending ? "Vérification..." : "Finaliser l'inscription →"}
              </Button>
              <Button asChild variant="ghost" className="w-full text-muted-foreground">
                <Link href="/dashboard/association">Passer cette étape</Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
