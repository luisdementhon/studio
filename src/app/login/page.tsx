"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

import { LoginSchema } from "@/lib/schemas";
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

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/auth/loading');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "L'adresse e-mail ou le mot de passe est incorrect.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
            Ravi de vous revoir ! Connectez-vous pour continuer.
            </CardDescription>
        </CardHeader>
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
                        <div className="flex items-center">
                            <FormLabel>Mot de passe</FormLabel>
                            <Link
                                href="/forgot-password"
                                className="ml-auto inline-block text-sm underline"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    <FormControl>
                        <Input
                        type="password"
                        placeholder="Mot de passe"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
                <div className="text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                    Inscrivez-vous
                </Link>
                </div>
            </CardFooter>
            </form>
        </Form>
        </Card>
    </div>
  );
}
