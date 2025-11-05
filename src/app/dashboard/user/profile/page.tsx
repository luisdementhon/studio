"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserOnboardingSchema } from "@/lib/schemas";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const causes = [
  { id: "environnement", label: "Environnement" },
  { id: "precarite", label: "Précarité" },
  { id: "education", label: "Éducation" },
  { id: "sante", label: "Santé" },
  { id: "animaux", label: "Cause animale" },
];

export default function UserProfilePage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UserOnboardingSchema>>({
    resolver: zodResolver(UserOnboardingSchema),
    defaultValues: {
      fullName: "Jean Dupont",
      causes: ["environnement", "precarite"],
      associations: [],
      donationCeiling: 50,
      donationMultiplier: 1,
    },
  });

  function onSubmit(values: z.infer<typeof UserOnboardingSchema>) {
    startTransition(() => {
      // Here you would call a server action to update the user profile
      console.log(values);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="preferences" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preferences">Préférences de don</TabsTrigger>
              <TabsTrigger value="infos">Informations</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences de don</CardTitle>
                  <CardDescription>Ajustez comment et combien vous souhaitez donner.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="causes"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base">Causes favorites</FormLabel>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          {causes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="causes"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value ?? []), item.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== item.id)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="donationCeiling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plafond hebdomadaire : {field.value}€</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value ?? 50]}
                            max={200}
                            step={5}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>Le montant maximum de dons par semaine.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="donationMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiplicateur d'arrondi : x{field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value ?? 1]}
                            max={10}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>Multipliez chaque arrondi pour amplifier votre impact.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="infos">
              <Card>
                <CardHeader>
                  <CardTitle>Informations Personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations de contact.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Adresse Email</FormLabel>
                    <FormControl>
                      <Input type="email" defaultValue="jean.dupont@email.com" disabled />
                    </FormControl>
                    <FormDescription>L'adresse email ne peut pas être modifiée.</FormDescription>
                  </FormItem>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sauvegarde..." : "Sauvegarder les changements"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
