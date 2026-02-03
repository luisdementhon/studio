"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/google-icon";

export default function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
          description: "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/auth/loading');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription Google",
        description: "Impossible de s'inscrire avec Google. Veuillez réessayer.",
      });
    }
  };

  const handleDemoAccess = async (dashboardPath: string) => {
    if (!auth) return;
    try {
      await signInAnonymously(auth);
      router.push(dashboardPath);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erreur de la démo",
        description: "Impossible de lancer le mode démo. Veuillez réessayer.",
      });
    }
  };

  const { isSubmitting } = form.formState;

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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 pt-6">
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
                <Button type="submit" className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110" disabled={isSubmitting} variant="vibrant">
                {isSubmitting ? "Création..." : "Créer mon compte"}
                </Button>
                 <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Ou
                        </span>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    S'inscrire avec Google
                </Button>
                <div className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link href="/login" className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 hover:brightness-110 transition-all">
                    Connectez-vous
                </Link>
                </div>
            </CardFooter>
            </form>
        </Form>
        
        <Separator className="my-4" />
        
        <div className="px-6 pb-6">
            <p className="text-center text-sm text-muted-foreground mb-4">Ou explorez nos interfaces en mode démo :</p>
            <div className="flex flex-col gap-3">
                 <Button variant="vibrant" onClick={() => handleDemoAccess('/dashboard/user')} className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110">
                    Dashboard Donateur (Démo)
                </Button>
                <Button variant="vibrant" onClick={() => handleDemoAccess('/dashboard/association')} className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110">
                    Dashboard Association (Démo)
                </Button>
            </div>
        </div>

        </Card>
    </div>
  );
}
