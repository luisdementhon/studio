"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { AssociationOnboardingSchema } from "@/lib/schemas";
import { submitAssociationOnboarding } from "@/app/onboarding/actions";

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
    startTransition(() => {
      submitAssociationOnboarding(values)
        .then((res) => {
          if (res?.error) {
            toast({ title: "Erreur", description: res.error, variant: "destructive" });
          } else {
            toast({ title: "Profil complété !", description: "Vous allez être redirigé vers votre tableau de bord." });
          }
        })
        .catch(() => {
          toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
        });
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
                        <Input placeholder="Les Restos du Coeur" {...field} />
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
                        <Input placeholder="Michel Colucci" {...field} />
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
                        <Input type="email" placeholder="contact@restosducoeur.org" {...field} />
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
                        <Input placeholder="W123456789" {...field} />
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
                      <Input type="number" placeholder="50000" {...field} />
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
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Vérification..." : "Finaliser l'inscription"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
