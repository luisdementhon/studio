'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandPattern } from '@/components/brand-pattern';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function BridgeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    const userUuid = searchParams.get('user_uuid');
    const itemId = searchParams.get('item_id');
    const success = searchParams.get('success');
    const onboarding = searchParams.get('onboarding') === 'true';
    
    // En V3, on vérifie surtout si l'opération a réussi
    if (success === 'false') {
      setStatus('error');
      setError("La synchronisation a été interrompue ou a échoué.");
      return;
    }

    const finalizeConnection = async () => {
      try {
        const response = await fetch('/api/bridge/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userUuid, itemId, email: user?.email, userId: user?.uid }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "L'échange du token a échoué.");
        }

        if (user && firestore) {
          const userRef = doc(firestore, 'users', user.uid);
          setDocumentNonBlocking(userRef, {
            bankConnected: true,
            bankName: data.bankName,
            bridgeItemId: data.bridgeItemId,
            bridgeUserUuid: data.bridgeUserUuid,
            connectedAt: new Date().toISOString(),
          }, { merge: true });
          
          setStatus('success');
        } else {
          throw new Error("Utilisateur non authentifié.");
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setError(err.message);
      }
    };

    if (user && !hasCalled.current) {
        hasCalled.current = true;
        finalizeConnection();
    }
  }, [searchParams, user, firestore]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <BrandPattern />
      
      <Card className="w-full max-w-md z-10 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
                <div className="p-3 bg-[hsl(var(--brand-coral))]/10 rounded-full">
                    <Loader2 className="h-12 w-12 text-[hsl(var(--brand-coral))] animate-spin" />
                </div>
            )}
            {status === 'success' && (
                <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
            )}
            {status === 'error' && (
                <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold">
            {status === 'loading' && "Connexion en cours..."}
            {status === 'success' && "Banque connectée !"}
            {status === 'error' && "Oups, une erreur !"}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {status === 'loading' && "Nous finalisons la liaison avec votre banque."}
            {status === 'success' && "Félicitations ! Votre compte est désormais lié à dotly."}
            {status === 'error' && "Nous n'avons pas pu connecter votre compte."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center text-muted-foreground">
          {status === 'success' ? (
            <p>
                Chaque transaction que vous effectuerez sera désormais arrondie à l'euro supérieur. 
                Merci de contribuer à un monde meilleur !
            </p>
          ) : status === 'error' ? (
            <p className="text-red-500">{error || "Une erreur inconnue est survenue."}</p>
          ) : (
            <p>Veuillez patienter quelques instants...</p>
          )}
        </CardContent>
        
        <CardFooter>
          {status !== 'loading' && (
            <Button 
                asChild 
                className="w-full text-lg h-12 font-bold" 
                variant="vibrant"
            >
                <Link href={searchParams.get('onboarding') === 'true' ? "/onboarding/user?step=3" : "/dashboard/user"}>
                {status === 'success' ? (searchParams.get('onboarding') === 'true' ? "Étape suivante (Paiement)" : "Aller à mon dashboard") : "Réessayer depuis mon profil"}
                </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function BridgeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 text-[hsl(var(--brand-coral))] animate-spin" />
      </div>
    }>
      <BridgeCallbackContent />
    </Suspense>
  );
}
