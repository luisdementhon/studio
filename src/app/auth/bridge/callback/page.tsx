'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandPattern } from '@/components/brand-pattern';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function BridgeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setStatus('error');
      setError("Aucun code d'autorisation n'a été trouvé.");
      return;
    }

    if (hasCalled.current) return;
    hasCalled.current = true;

    const exchangeToken = async () => {
      try {
        const response = await fetch('/api/bridge/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
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
            // bridgeAccessToken: data.bridgeAccessToken, // Stockage simplifié pour le prototype
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

    if (user) {
        exchangeToken();
    }
  }, [searchParams, user, firestore]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <BrandPattern />
      
      <Card className="w-full max-w-md z-10 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
                <div className="p-3 bg-amber-100 rounded-full">
                    <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
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
            {status === 'success' && "Félicitations ! Votre compte est désormais lié à Dotly."}
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
                className="w-full text-lg h-12 from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110 font-bold" 
                variant="vibrant"
            >
                <Link href="/dashboard/user">
                {status === 'success' ? "Aller à mon dashboard" : "Réessayer depuis mon profil"}
                </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
