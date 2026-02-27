"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { doc } from "firebase/firestore";
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
import { Link2 } from "lucide-react";

const causes = [
  { id: "environnement", label: "Horizons Durables" },
  { id: "precarite", label: "Solidarité Urbaine" },
  { id: "education", label: "Savoir pour Tous" },
  { id: "sante", label: "Santé Partagée" },
  { id: "animaux", label: "Amis des Animaux" },
];

export default function UserOnboardingPage() {
  const [isPending, startTransition] = useTransition();
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

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

  function onSubmit(values: z.infer<typeof UserOnboardingSchema>) {
    if (!user) {
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

      toast({ title: "Profil complété !", description: "Vous allez être redirigé vers votre tableau de bord." });
      router.push("/dashboard/user");
    });
  }

  const handleConnectBank = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/bridge/connect', {
        method: 'POST',
      });

      if (!response.ok) throw new Error("Erreur de connexion à l'API");

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error(data.error || "Impossible de générer l'URL de connexion.");
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
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurez votre profil donateur</CardTitle>
          <CardDescription>
            Personnalisez votre expérience Dotly. Ces informations nous aident à aligner vos dons avec vos valeurs.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                        render={({ field }) => (
                          <FormItem
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
                        )}
                      />
                    ))}
                    <FormField
                        key="autre"
                        control={form.control}
                        name="causes"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("autre")}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value ?? []), "autre"])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== "autre"
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Autre
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedCauses.includes('autre') && (
                <FormField
                  control={form.control}
                  name="otherCause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préciser l'autre cause</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre cause" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="donationCeiling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plafond de don mensuel : {field.value}€</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value ?? 50]}
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
                        value={[field.value ?? 1]}
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
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" disabled={isPending || !user} className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110" variant="vibrant">
                {isPending ? "Finalisation..." : "Terminer et accéder à mon espace"}
              </Button>
              <Button asChild variant="ghost" className="w-full text-center">
                <Link href="/dashboard/user">Passer et aller au tableau de bord</Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Separator />

      <div className="space-y-4 text-center">
          <h3 className="text-base font-semibold">Étape suivante : Connexion bancaire (optionnel)</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connectez votre compte bancaire pour activer l'arrondi automatique à chaque transaction. C'est sécurisé et vous gardez le contrôle.
          </p>
          <Button 
            onClick={handleConnectBank}
            disabled={isConnecting}
            className="from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110" 
            variant="vibrant"
          >
            <Link2 className="mr-2 h-4 w-4" />
            {isConnecting ? "Connexion en cours..." : "Connecter ma banque"}
          </Button>
      </div>

    </div>
  );
}
