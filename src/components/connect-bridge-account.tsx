"use client";

import { useUser, useFirestore, useDoc } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Banknote, CheckCircle2, Link2, Loader2, XCircle } from "lucide-react";
import { useBridge } from "@/hooks/use-bridge";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export function ConnectBridgeAccount() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  const handleSuccess = (itemId: string, metadata: any) => {
    if (!userDocRef) return;
    setDocumentNonBlocking(userDocRef, { 
      bridgeItemId: itemId,
      bankConnected: true,
      bankName: metadata.bank.name,
      connectedAt: serverTimestamp(),
    }, { merge: true });

    toast({
      title: "Connexion réussie !",
      description: `Votre compte ${metadata.bank.name} est maintenant connecté.`,
      className: "bg-green-100 text-green-800 border-green-300",
    });

    setTimeout(() => {
        router.push('/dashboard/user');
    }, 2000);
  };

  const handleError = () => {
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: "La connexion bancaire a échoué. Veuillez réessayer.",
    });
  };

  const handleClose = () => {
    toast({
      title: "Connexion annulée",
      description: "Le processus de connexion a été annulé.",
    });
  };

  const { open, isConnecting, isClientIdSet, isSdkReady, sdkError } = useBridge({
    onSuccess: handleSuccess,
    onError: handleError,
    onClose: handleClose,
  });

  const isLoading = isUserLoading || isProfileLoading;
  const bankConnected = userData?.bankConnected;
  const bankName = userData?.bankName;

  const getButtonState = () => {
    if (sdkError) {
      return { text: "Erreur de chargement", disabled: true, icon: <XCircle /> };
    }
    if (!isClientIdSet) {
      return { text: "Configuration requise", disabled: true, icon: <XCircle /> };
    }
    if (!isSdkReady) {
        return { text: "Chargement...", disabled: true, icon: <Loader2 className="animate-spin"/> };
    }
    if (isConnecting) {
      return { text: "Connexion...", disabled: true, icon: <Loader2 className="animate-spin" /> };
    }
    if (!user) {
        return { text: "Connecter ma banque", disabled: true, icon: <Link2 /> };
    }
    return { text: "Connecter ma banque", disabled: false, icon: <Link2 /> };
  };

  const buttonState = getButtonState();

  if (isLoading && !user) {
    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
  }

  if (bankConnected && bankName) {
    return (
        <Card className="bg-green-50 border-green-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-base text-green-800">Compte connecté !</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-green-700">
                    Votre compte bancaire <span className="font-semibold">{bankName}</span> est connecté à Dotly. L'arrondi automatique est actif.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-base">Connecter votre banque</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
            <Banknote className="h-12 w-12 text-primary" />
            <p className="text-sm text-muted-foreground">
                Activez l'arrondi automatique en connectant votre compte bancaire en toute sécurité.
            </p>
            <Button onClick={open} disabled={buttonState.disabled}>
                {buttonState.icon}
                {buttonState.text}
            </Button>
            {(sdkError || !isClientIdSet) && (
              <p className="text-xs text-destructive text-center px-4 mt-2">
                {sdkError ? sdkError.message : "La clé client Bridge n'est pas configurée. Si vous venez de l'ajouter dans `.env.local`, veuillez redémarrer le serveur de développement."}
              </p>
            )}
        </CardContent>
    </Card>
  );
}
