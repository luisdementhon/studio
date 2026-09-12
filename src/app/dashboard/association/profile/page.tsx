"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useEffect, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AssociationOnboardingSchema } from "@/lib/schemas";
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
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { authedFetch } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssociationProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const associationDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'associations', user.uid);
  }, [firestore, user]);

  const { data: associationData, isLoading: isProfileLoading } = useDoc(associationDocRef);

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

  useEffect(() => {
    if (associationData) {
      form.reset(associationData);
    }
  }, [associationData, form]);

  function onSubmit(values: z.infer<typeof AssociationOnboardingSchema>) {
    startTransition(async () => {
      try {
        // Même route que l'inscription : le RNA est re-vérifié côté serveur à
        // chaque enregistrement, y compris en cas de modification.
        const response = await authedFetch("/api/association/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "L'enregistrement a échoué.");
        }

        toast({
          title: "Profil mis à jour",
          description: "Les informations de l'association ont été enregistrées.",
        });
      } catch (error: any) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-[500px] w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tight text-foreground leading-[0.9]">
                Profil<br />
                <span className="text-brand-mint font-serif italic font-bold">Asso.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-md font-headline font-light leading-relaxed">Gérez les informations publiques et administratives de votre association.</p>
        </div>
        <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm px-6 py-3 rounded-2xl bg-brand-mint text-white font-bold border-0 shadow-lg shadow-brand-mint/20">✓ Vérifié</Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          <Card className="rounded-[3.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
            <CardHeader className="p-12 pb-4">
              <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Informations Générales</CardTitle>
              <CardDescription className="text-lg font-headline font-light">Ces données sont utilisées pour votre page publique.</CardDescription>
            </CardHeader>
            <CardContent className="p-12 pt-8 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField
                  control={form.control}
                  name="associationName"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Nom de l'organisation</FormLabel>
                      <FormControl>
                        <Input className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-lg font-medium focus:ring-2 focus:ring-brand-mint/20 transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rnaNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Numéro RNA</FormLabel>
                      <FormControl>
                        <Input className="h-16 rounded-[1.5rem] bg-black/[0.01] border-none px-6 text-lg font-medium text-muted-foreground/40 cursor-not-allowed" {...field} disabled />
                      </FormControl>
                      <FormDescription className="ml-1 text-xs opacity-50 font-medium">L'identifiant officiel de votre association.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeName"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Représentant légal</FormLabel>
                      <FormControl>
                        <Input className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-lg font-medium focus:ring-2 focus:ring-brand-mint/20 transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Email de contact</FormLabel>
                      <FormControl>
                        <Input type="email" className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-lg font-medium focus:ring-2 focus:ring-brand-mint/20 transition-all" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Histoire & Mission</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Racontez votre impact..." 
                        className="min-h-[200px] rounded-[2.5rem] bg-black/[0.03] border-none p-8 text-lg font-medium leading-relaxed focus:ring-2 focus:ring-brand-mint/20 transition-all resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField
                    control={form.control}
                    name="fundraisingGoal"
                    render={({ field }) => (
                    <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Objectif Annuel (€)</FormLabel>
                        <FormControl>
                        <Input type="number" className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-2xl font-extrabold focus:ring-2 focus:ring-brand-mint/20 transition-all" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="currentMissions"
                    render={({ field }) => (
                    <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Missions en cours</FormLabel>
                        <FormControl>
                        <Input className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-lg font-medium focus:ring-2 focus:ring-brand-mint/20 transition-all" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </CardContent>
            <CardFooter className="p-12 pt-0 flex justify-end">
                <Button type="submit" disabled={isPending} className="h-20 rounded-[1.5rem] px-12 text-xl font-extrabold shadow-xl shadow-brand-mint/20 hover:scale-[1.02] active:scale-[0.98] transition-all" variant="vibrant">
                {isPending ? "Publication..." : "Enregistrer les modifications"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
