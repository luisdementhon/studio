"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition } from "react";
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

export default function AssociationProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof AssociationOnboardingSchema>>({
    resolver: zodResolver(AssociationOnboardingSchema),
    defaultValues: {
      associationName: "Les Restos du Coeur",
      representativeName: "Michel Colucci",
      contactEmail: "contact@restosducoeur.org",
      rnaNumber: "W751046580",
      description: "Aide et assistance aux plus démunis, notamment dans le domaine alimentaire par l'accès à des repas gratuits.",
      fundraisingGoal: 50000,
      currentMissions: "Financer la campagne hivernale 2024.",
    },
  });

  function onSubmit(values: z.infer<typeof AssociationOnboardingSchema>) {
    startTransition(() => {
      console.log(values);
      toast({
        title: "Profil mis à jour",
        description: "Les informations de l'association ont été enregistrées.",
      });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil Association</h1>
            <p className="text-muted-foreground">Gérez les informations publiques et administratives de votre association.</p>
        </div>
        <Badge variant="secondary" className="text-base">Vérifié</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'Association</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="associationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'association</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} disabled />
                      </FormControl>
                      <FormDescription>Le numéro RNA ne peut pas être modifié.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="representativeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du représentant légal</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email de contact public</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                    <FormLabel>Description publique</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Décrivez la mission et les activités de votre association..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="fundraisingGoal"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Objectif de collecte annuel (€)</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
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
                        <FormLabel>Missions à financer actuellement</FormLabel>
                        <FormControl>
                        <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                {isPending ? "Sauvegarde..." : "Mettre à jour le profil"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
