
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";

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
import { initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { GoogleIcon } from "@/components/google-icon";
import { useState } from "react";

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await initiateGoogleSignIn(auth);
      router.push('/auth/loading');
    } catch (error: any) {
       if (error.code !== 'auth/popup-closed-by-user') {
            toast({
                variant: "destructive",
                title: "Erreur de connexion",
                description: "Impossible de se connecter avec Google. Veuillez réessayer.",
            });
       }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof SignupSchema>) => {
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
          description: "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    }
  };

  const isSubmitting = form.formState.isSubmitting || isGoogleLoading;


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <BrandPattern />
        <Card className="w-full max-w-sm z-10 shadow-xl">
        <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
            Créez votre compte pour commencer à faire la différence.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <Button variant="outline" onClick={onGoogleSignIn} className="shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting}>
                <GoogleIcon className="h-5 w-5 mr-2" />
                {isGoogleLoading ? 'Redirection...' : 'Continuer avec Google'}
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Ou s'inscrire avec un e-mail
                    </span>
                </div>
            </div>
        </CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="grid gap-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="Email"
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
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                        <Input
                        type="password"
                        placeholder="Mot de passe"
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
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                        <Input
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        {...field}
                        disabled={isSubmitting}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting} variant="vibrant">
                {form.formState.isSubmitting ? "Création..." : "Créer mon compte"}
                </Button>
                <div className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link href="/login" className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-500 hover:brightness-110 transition-all">
                    Connectez-vous
                </Link>
                </div>
            </CardFooter>
            </form>
        </Form>
        </Card>
    </div>
  );
}
