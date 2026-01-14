"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { AssociationOnboardingSchema } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
import Link from "next/link";

import { useFirestore, useUser } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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

  function onSubmit(values: z.infer<typeof AssociationOnboardingSchema>) {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté pour créer une association.", variant: "destructive" });
      return;
    }

    startTransition(() => {
      const associationProfile = {
        id: user.uid, 
        ...values
      };
      
      const associationDocRef = doc(firestore, "associations", user.uid);
      setDocumentNonBlocking(associationDocRef, associationProfile, { merge: true });

      toast({ title: "Profil complété !", description: "Les informations de votre association ont été enregistrées." });
      router.push("/dashboard/association");
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Configurez le profil de votre association</CardTitle>
          <CardDescription>
            Fournissez ces informations pour que nous puissions vérifier votre association et commencer à recevoir des dons.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="associationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'association</FormLabel>
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
                      <FormLabel>Nom du représentant</FormLabel>
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
                      <FormLabel>Email de contact</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email de contact" {...field} />
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
                      <FormLabel>Numéro RNA</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro RNA" {...field} />
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
                  <FormItem>
                    <FormLabel>Description de l'association</FormLabel>
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
                    <FormLabel>Objectif de collecte annuel (€)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Objectif de collecte" {...field} />
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
                    <FormLabel>Missions à financer (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Financer 1000 repas chauds, construire un refuge..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" disabled={isPending || !user} className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110" variant="vibrant">
                {isPending ? "Vérification..." : "Finaliser l'inscription"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/dashboard/association">Passer et aller au tableau de bord</Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
