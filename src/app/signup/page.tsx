"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";

import { SignupSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { BrandPattern } from "@/components/brand-pattern";
import { GoogleIcon } from "@/components/google-icon";
import { DotlyBrand } from "@/components/ui/dotly-brand";

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (auth) {
      setIsAuthReady(true);
    }
  }, [auth]);

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof SignupSchema>) => {
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      router.push('/auth/loading');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: "Cette adresse email est déjà utilisée. Veuillez vous connecter.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isAuthReady || !auth) {
      toast({
        variant: "destructive",
        title: "Initialisation en cours",
        description: "L'authentification n'est pas encore prête, veuillez réessayer dans un instant.",
      });
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/auth/loading');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'inscription Google",
        description: error.message || "Une erreur inconnue est survenue. Veuillez réessayer.",
      });
    }
  };



  const { isSubmitting } = form.formState;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden p-6">
        {/* Background Accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-coral/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-mint/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 flex flex-col items-center">
            <Link href="/" className="mb-12 group">
                <DotlyBrand className="text-5xl transition-transform group-hover:scale-105 inline-block" />
            </Link>

            <Card className="w-full p-4 border-none shadow-2xl shadow-black/[0.03] rounded-[3rem] bg-white/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-6">
                <CardTitle className="text-4xl font-headline font-bold tracking-tight mb-2">Inscription</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                Rejoignez le mouvement du changement.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="grid gap-6 pt-2">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                            type="email"
                            placeholder="Adresse email"
                            className="h-14 text-lg rounded-2xl bg-muted/30"
                            {...field}
                            disabled={isSubmitting}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                            type="password"
                            placeholder="Mot de passe"
                            className="h-14 text-lg rounded-2xl bg-muted/30"
                            {...field}
                            disabled={isSubmitting}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            className="h-14 text-lg rounded-2xl bg-muted/30"
                            {...field}
                            disabled={isSubmitting}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-6 pt-6">
                    <Button type="submit" className="w-full h-16 text-xl rounded-2xl shadow-lg shadow-brand-coral/20" disabled={isSubmitting} variant="vibrant">
                    {isSubmitting ? "Création..." : "Créer mon compte"}
                    </Button>
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted/30" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-4 text-muted-foreground font-medium">
                                OU
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" type="button" className="w-full h-16 text-lg rounded-2xl bg-white hover:bg-muted/30 border-muted/30 transition-all" onClick={handleGoogleSignIn} disabled={isSubmitting || !isAuthReady}>
                        <GoogleIcon className="mr-3 h-6 w-6" />
                        S'inscrire avec Google
                    </Button>
                    <div className="mt-2 text-base text-center text-muted-foreground">
                    Vous avez déjà un compte ?{" "}
                    <Link href="/login" className="font-semibold text-brand-coral hover:text-brand-coral/80 transition-colors">
                        Connectez-vous
                    </Link>
                    </div>
                </CardFooter>
                </form>
            </Form>


            </Card>
        </div>
    </div>
  );
}
