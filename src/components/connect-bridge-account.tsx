"use client";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";

export function ConnectBridgeAccount() {

  // The Bridge integration is paused because the npm package is not available.
  // The code is kept here as a reference for when the package is restored.
  
  /*
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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

  if (accessToken) {
    return (
      <div className="p-4 bg-secondary rounded-lg text-center">
        <p className="font-semibold text-primary">Compte bancaire connecté !</p>
        <p className="text-sm text-muted-foreground mt-1">L'arrondi automatique est maintenant activé.</p>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading || !BRIDGE_CLIENT_ID} className="w-full">
      {isLoading ? "Chargement de Bridge..." : "Connecter mon compte bancaire"}
    </Button>
  );
  */

  return (
    <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Intégration en cours</AlertTitle>
        <AlertDescription>
            La connexion aux comptes bancaires via Bridge est en cours de développement. Cette fonctionnalité sera bientôt disponible.
        </AlertDescription>
    </Alert>
  )
}
