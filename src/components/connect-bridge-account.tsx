"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

// We will use the useBridge hook once the package is installed.
// For now, we'll simulate the behavior.
// import { useBridge } from "@bridge-api/integration-react";
import { BRIDGE_CLIENT_ID } from "@/lib/bridge";


export function ConnectBridgeAccount() {
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // This is a placeholder for the real `connect` function from `useBridge`
  const handleConnect = () => {
      setIsLoading(true);
      toast({
          title: "Simulation",
          description: "Le package Bridge n'est pas encore installé. C'est une simulation.",
      });

      // Simulate a successful connection for UI purposes
      setTimeout(() => {
          setAccessToken(`simulated_token_for_${user?.uid}`);
          toast({
              title: "Connexion simulée réussie !",
              description: "Ceci est une simulation de connexion de compte.",
          });
          setIsLoading(false);
      }, 1500);
  };
  
  /* 
  // This is the actual code we'll use once the package is installed.
  const { connect } = useBridge({
    clientId: BRIDGE_CLIENT_ID,
    email: user?.email || undefined, 
    redirectUrl: typeof window !== 'undefined' ? window.location.href : '',
    onSuccess: (authorization) => {
      toast({
        title: "Connexion réussie !",
        description: "Votre compte a bien été connecté.",
      });
      // In a real app, you'd exchange this code for an access token on your server.
      setAccessToken(`simulated_token_for_${authorization.user.uuid}`);
      setIsLoading(false);
    },
    onFailure: (error) => {
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: `Erreur: ${error.message}`,
      });
      setIsLoading(false);
    },
    onClose: () => {
      setIsLoading(false);
    },
  });
  
  const handleConnect = () => {
    setIsLoading(true);
    connect();
  };
  */


  if (accessToken) {
    return (
      <div className="p-4 bg-secondary rounded-lg text-center">
        <p className="font-semibold text-primary">Compte bancaire connecté !</p>
        <p className="text-sm text-muted-foreground mt-1">L'arrondi automatique est maintenant activé.</p>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading} className="w-full">
      {isLoading ? "Chargement de Bridge..." : "Connecter mon compte bancaire"}
    </Button>
  );
}
