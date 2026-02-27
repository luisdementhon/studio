'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function BridgeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Finalisation de la connexion avec votre banque...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Erreur : ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage("Impossible de récupérer le code d'autorisation.");
      return;
    }

    if (isUserLoading) return;

    if (!user) {
      setStatus('error');
      setMessage("Veuillez vous connecter pour lier votre compte.");
      return;
    }

    const processConnection = async () => {
      try {
        const response = await fetch('/api/bridge/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        // Enregistrer les infos dans Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userDocRef, {
          bridgeItemId: result.itemId,
          bankConnected: true,
          bankName: result.bankName,
          connectedAt: serverTimestamp(),
        }, { merge: true });

        setStatus('success');
        setMessage(`Succès ! Votre compte ${result.bankName} est connecté.`);
        
        toast({
          title: "Banque connectée",
          description: `Votre compte ${result.bankName} a été lié avec succès.`
        });

        // Redirection après 2 secondes
        setTimeout(() => router.push('/dashboard/user'), 2000);

      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || "Une erreur est survenue lors de la connexion.");
      }
    };

    processConnection();
  }, [searchParams, user, isUserLoading, firestore, router, toast]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Connexion Bancaire</CardTitle>
        <CardDescription>Sécurisé par Bridge</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
        {status === 'success' && <CheckCircle className="h-10 w-10 text-green-500" />}
        {status === 'error' && <XCircle className="h-10 w-10 text-destructive" />}
        <p className="text-center font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function BridgeCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin" />}>
        <BridgeCallbackContent />
      </Suspense>
    </div>
  );
}
