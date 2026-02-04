'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function BridgeCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Traitement de la connexion en cours...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Erreur de connexion bancaire : ${error}`);
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: 'Le fournisseur de services bancaires a renvoyé une erreur.',
      });
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage("Aucun code d'autorisation trouvé. Redirection...");
      setTimeout(() => router.replace('/dashboard/user/profile'), 3000);
      return;
    }

    if (isUserLoading) {
      return; // Wait for user to be loaded
    }

    if (!user) {
      setStatus('error');
      setMessage("Utilisateur non authentifié. Veuillez vous connecter et réessayer.");
      toast({
        variant: 'destructive',
        title: 'Utilisateur non connecté',
        description: "Vous devez être connecté pour lier un compte bancaire.",
      });
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    const exchangeCodeForToken = async () => {
      try {
        const response = await fetch('/api/bridge/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Échec de l\'échange du code.');
        }

        const { item_id, bank_name } = await response.json();

        // Save the item ID to Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userDocRef, {
          bridgeItemId: item_id,
          bankConnected: true,
          bankName: bank_name,
          connectedAt: serverTimestamp(),
        }, { merge: true });

        setStatus('success');
        setMessage('Votre compte bancaire a été connecté avec succès ! Vous allez être redirigé.');
        toast({
          title: 'Connexion réussie !',
          description: `Votre compte ${bank_name} est maintenant connecté.`,
        });

        setTimeout(() => router.replace('/dashboard/user/profile'), 2000);

      } catch (err: any) {
        setStatus('error');
        setMessage(err.message);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: err.message,
        });
      }
    };

    exchangeCodeForToken();

  }, [searchParams, router, toast, user, isUserLoading, firestore]);

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md z-10">
            <CardHeader>
            <CardTitle>Connexion Bancaire</CardTitle>
            <CardDescription>Finalisation de la connexion avec votre banque.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
            {renderIcon()}
            <p className="text-center text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    </div>
  );
}


export default function BridgeCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <BridgeCallback />
        </Suspense>
    )
}
