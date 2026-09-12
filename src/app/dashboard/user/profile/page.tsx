"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useEffect, useTransition, useMemo, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { authedFetch } from "@/lib/api-client";
import { resizeToAvatarDataUrl } from "@/lib/image";
import { DataRightsSection } from "@/components/profile/data-rights";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, CheckCircle2, Link2, CreditCard, Clock, Upload, Trash2 } from "lucide-react";
import { DotlyBrand } from "@/components/ui/dotly-brand";
import { StripeWrapper } from "@/components/providers/stripe-wrapper";
import { PaymentMethodSection } from "@/components/profile/payment-method";

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

export default function UserProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

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

  useEffect(() => {
    if (userData) {
      const { firstName, lastName, photoURL: existingPhoto, ...rest } = userData;
      if (existingPhoto) {
        setPhotoURL(existingPhoto);
      }
      form.reset({
        fullName: `${firstName || ''} ${lastName || ''}`.trim(),
        ...rest
      });
    }
  }, [userData, form]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Fichier invalide",
        description: "Veuillez choisir une image.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Redimensionnement obligatoire : la photo est stockée dans le document
      // Firestore, plafonné à 1 Mo.
      const dataUrl = await resizeToAvatarDataUrl(file);
      setPhotoURL(dataUrl);

      if (userDocRef) {
        setDocumentNonBlocking(userDocRef, { photoURL: dataUrl }, { merge: true });
        toast({
          title: "Photo mise à jour",
          description: "Votre photo de profil a bien été enregistrée.",
        });
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de traiter cette image.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePhoto = () => {
    setPhotoURL(null);
    if (userDocRef) {
      setDocumentNonBlocking(userDocRef, { photoURL: "" }, { merge: true });
      toast({
        title: "Photo supprimée",
        description: "La photo de profil a été retirée.",
      });
    }
  };

  const watchedCauses = form.watch("causes", []) ?? [];

  function onSubmit(values: z.infer<typeof UserOnboardingSchema>) {
    if (!user) {
      toast({ title: "Erreur", description: "Vous n'êtes pas connecté.", variant: "destructive" });
      return;
    }
    startTransition(() => {
      const { fullName, ...preferences } = values;
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const userProfile = {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        photoURL: photoURL || "",
        ...preferences
      };

      setDocumentNonBlocking(userDocRef!, userProfile, { merge: true });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    });
  }

  const isLoading = isUserLoading || isProfileLoading;
  const handleConnectBank = async () => {
    try {
      const response = await authedFetch("/api/bridge/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de générer le lien de connexion.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
    )
  }

  return (
    <StripeWrapper>
      <div className="flex flex-col gap-12 max-w-5xl">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            mon<br />
            <span className="text-brand-coral">profil.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-headline font-light max-w-2xl">
          Gérez vos informations personnelles et vos préférences de don sur <DotlyBrand className="inline text-lg" />
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="preferences" className="w-full space-y-12">
            <TabsList className="bg-muted/20 p-2 rounded-[2rem] h-auto flex flex-wrap md:flex-nowrap gap-2 w-fit">
              <TabsTrigger value="preferences" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-black/[0.03] text-base font-bold transition-all">Préférences</TabsTrigger>
              <TabsTrigger value="connexions" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-black/[0.03] text-base font-bold transition-all">Comptes</TabsTrigger>
              <TabsTrigger value="infos" className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-black/[0.03] text-base font-bold transition-all">Informations</TabsTrigger>
            </TabsList>

            <TabsContent value="preferences" className="mt-0">
              <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">Préférences de don</CardTitle>
                  <CardDescription className="text-base font-headline font-light">Ajustez comment et combien vous souhaitez donner chaque mois.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-10">
                  <FormField
                    control={form.control}
                    name="causes"
                    render={() => (
                      <FormItem className="space-y-6">
                        <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Causes favorites</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[...causes, { id: 'autre', label: 'Autre' }].map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="causes"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-4 space-y-0 bg-muted/20 p-4 rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer">
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
                                      className="rounded-lg h-6 w-6 border-muted/50 data-[state=checked]:bg-brand-coral data-[state=checked]:border-brand-coral"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-base font-bold text-foreground cursor-pointer">{item.label}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
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
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Préciser l'autre cause</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre cause" className="h-14 rounded-2xl bg-muted/30 border-none px-6 text-base font-medium focus:ring-2 focus:ring-brand-coral/20 transition-all" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                    <FormField
                        control={form.control}
                        name="donationCeiling"
                        render={({ field }) => (
                        <FormItem className="space-y-6">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Plafond mensuel</FormLabel>
                                <span className="text-2xl font-bold text-brand-coral">{field.value}€</span>
                            </div>
                            <FormControl>
                            <Slider
                                value={[field.value ?? 50]}
                                min={5}
                                max={200}
                                step={5}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                            />
                            </FormControl>
                            <FormDescription className="text-sm font-medium">Le montant maximum prélevé par mois. (Min 5€)</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="donationMultiplier"
                        render={({ field }) => (
                        <FormItem className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Multiplicateur</FormLabel>
                                    <span className="text-[10px] font-bold text-brand-coral mt-1">Env. {(field.value * 12.5).toFixed(2)}€ / mois</span>
                                </div>
                                <span className="text-2xl font-bold text-brand-coral">x{field.value}</span>
                            </div>
                            <FormControl>
                            <Slider
                                value={[field.value ?? 1]}
                                min={1}
                                max={10}
                                step={0.5}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                            />
                            </FormControl>
                            <FormDescription className="text-sm font-medium">Amplifiez chaque arrondi pour plus d'impact.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="connexions" className="mt-0">
              <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">Connexions Bancaires</CardTitle>
                  <CardDescription className="text-base font-headline font-light">Connectez vos comptes pour activer l'arrondi automatique sur vos achats.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  {userData?.bankConnected ? (
                    <div className="bg-brand-mint/10 rounded-[2rem] p-8 flex items-center gap-6 border-2 border-brand-mint/20">
                        <div className="h-16 w-16 rounded-2xl bg-brand-mint flex items-center justify-center shadow-lg shadow-brand-mint/20">
                            <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Compte connecté</h3>
                            <p className="text-muted-foreground font-medium mt-1">
                                Votre compte <span className="text-brand-mint">{userData.bankName}</span> est actif.
                            </p>
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 text-center p-12 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted/50">
                        <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center shadow-xl shadow-black/[0.03]">
                            <Banknote className="h-10 w-10 text-brand-coral" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-headline font-bold">Activer l'arrondi</h3>
                            <p className="text-muted-foreground max-w-sm font-medium">
                                Connectez votre compte bancaire en toute sécurité via Bridge pour transformer vos centimes en dons.
                            </p>
                        </div>
                        <Button onClick={handleConnectBank} className="h-16 rounded-2xl px-10 text-lg font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] active:scale-[0.98] transition-all" variant="vibrant">
                            <Link2 className="mr-3 h-5 w-5" />
                            Connecter ma banque
                        </Button>
                    </div>
                  )}

                  <div className="mt-12 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-brand-coral/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-brand-coral" />
                      </div>
                      <h3 className="text-xl font-headline font-bold">Moyen de prélèvement</h3>
                    </div>
                    
                    <PaymentMethodSection />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="infos" className="mt-0">
              <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">Informations Personnelles</CardTitle>
                  <CardDescription className="text-base font-headline font-light">Mettez à jour vos informations de contact.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                  {/* Photo de profil */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Photo de profil</label>
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/20 p-6 rounded-2xl">
                      <Avatar className="h-20 w-20 rounded-full border-2 border-brand-coral/20 shadow-md overflow-hidden shrink-0">
                        {photoURL ? (
                          <AvatarImage src={photoURL} alt="Photo de profil" className="object-cover w-full h-full" />
                        ) : null}
                        <AvatarFallback className="rounded-full bg-brand-coral text-white text-2xl font-extrabold">
                          {form.watch("fullName") ? form.watch("fullName").charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-black text-white hover:bg-black/80 font-bold px-5 py-2.5 rounded-full text-sm transition-all shadow-sm">
                            <Upload className="w-4 h-4" />
                            Changer la photo
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                          </label>
                          {photoURL && (
                            <Button type="button" variant="outline" onClick={handleRemovePhoto} className="rounded-full border-black/10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold h-10 px-4 text-sm">
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Supprimer
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Format JPG ou PNG. 2 Mo maximum.</p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Nom complet</FormLabel>
                        <FormControl>
                          <Input className="h-14 rounded-2xl bg-muted/30 border-none px-6 text-base font-medium focus:ring-2 focus:ring-brand-coral/20 transition-all" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Adresse Email</label>
                    <Input value={user?.email || ''} disabled className="h-14 rounded-2xl bg-muted/10 border-none px-6 text-base font-medium text-muted-foreground/60 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground ml-1">L'adresse email ne peut pas être modifiée.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/[0.02] mt-8">
                <CardHeader className="p-10 pb-6">
                  <CardTitle className="text-2xl font-headline font-extrabold tracking-tight">
                    Mes données
                  </CardTitle>
                  <CardDescription className="text-base font-headline font-light">
                    Exportez ou supprimez l'ensemble de vos données personnelles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                  <DataRightsSection />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-12 flex justify-end">
            <Button type="submit" disabled={isPending} className="h-16 rounded-2xl px-12 text-lg font-bold shadow-xl shadow-brand-coral/20 hover:scale-[1.02] active:scale-[0.98] transition-all" variant="vibrant">
              {isPending ? "Sauvegarde..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
    </StripeWrapper>
  );
}
