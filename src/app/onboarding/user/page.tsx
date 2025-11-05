"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserOnboardingSchema } from "@/lib/schemas";
import { submitUserOnboarding } from "@/app/onboarding/actions";

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

const causes = [
  { id: "environnement", label: "Environnement" },
  { id: "precarite", label: "Précarité" },
  { id: "education", label: "Éducation" },
  { id: "sante", label: "Santé" },
  { id: "animaux", label: "Cause animale" },
];

export default function UserOnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof UserOnboardingSchema>>({
    resolver: zodResolver(UserOnboardingSchema),
    defaultValues: {
      fullName: "",
      causes: [],
      associations: [],
      donationCeiling: 50,
      donationMultiplier: 1,
    },
  });

  function onSubmit(values: z.infer<typeof UserOnboardingSchema>) {
    startTransition(() => {
      submitUserOnboarding(values)
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
          <CardTitle>Configurez votre profil donateur</CardTitle>
          <CardDescription>
            Personnalisez votre expérience Dotly. Ces informations nous aident à aligner vos dons avec vos valeurs.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet" {...field} />
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
                    <div className="mb-4">
                      <FormLabel className="text-base">Causes qui vous tiennent à cœur</FormLabel>
                      <FormDescription>
                        Sélectionnez les causes que vous souhaitez soutenir en priorité.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    {causes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="causes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value ?? []), item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
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
                    <FormLabel>Plafond de don mensuel : {field.value}€</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[50]}
                        max={200}
                        step={5}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Le montant maximum que vous souhaitez donner par mois.
                    </FormDescription>
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
                        defaultValue={[1]}
                        max={10}
                        step={1}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                     <FormDescription>
                      Multipliez chaque arrondi pour donner plus. (Ex: 0.20€ x2 = 0.40€)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Finalisation..." : "Terminer et accéder à mon espace"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
