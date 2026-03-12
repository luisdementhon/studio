'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe';
import type { Association } from '@/lib/schemas';
import { Skeleton } from './ui/skeleton';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  amount: number;
  selectedAssociation: Association | undefined;
  setProcessing: (isProcessing: boolean) => void;
  onSuccessfulPayment: () => void;
}

function CheckoutForm({
  amount,
  selectedAssociation,
  setProcessing,
  onSuccessfulPayment,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: submitError.message,
      });
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: error.message,
      });
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccessfulPayment();
    } else {
        setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110 shadow-lg shadow-amber-400/20 font-bold"
        variant="vibrant"
        disabled={!stripe || !elements}
        type="submit"
      >
        Confirmer le don de {amount} € à {selectedAssociation?.associationName}
      </Button>
    </form>
  );
}

export function DonationForm({ associations, isLoading }: { associations: Association[], isLoading: boolean }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [amount, setAmount] = useState<number | undefined>();
  const [selectedAssoId, setSelectedAssoId] = useState<string | undefined>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setProcessing] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberValue = parseFloat(value);
    setAmount(value === '' ? undefined : (isNaN(numberValue) ? amount : numberValue));
  };

  const handleCreateDonation = () => {
    if (!amount || !selectedAssoId || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Erreur interne', description: 'Données manquantes pour l\'enregistrement.' });
      setProcessing(false);
      return;
    }

    const userDonationRef = doc(collection(firestore, 'users', user.uid, 'donations'));
    const donationId = userDonationRef.id;

    const donationData = {
        id: donationId,
        userId: user.uid,
        associationId: selectedAssoId,
        amount: amount,
        transactionDate: serverTimestamp(),
        isRecurring: false,
    };

    setDocumentNonBlocking(userDonationRef, donationData, { merge: true });
    
    const associationDonationRef = doc(firestore, 'associations', selectedAssoId, 'donations', donationId);
    setDocumentNonBlocking(associationDonationRef, donationData, { merge: true });

    toast({
        title: "Paiement réussi !",
        description: "Votre don a bien été enregistré. Merci pour votre générosité !",
    });

    setClientSecret(null);
    setAmount(undefined);
    setSelectedAssoId(undefined);
    setProcessing(false);
  };

  const handleDonationClick = async () => {
    if (!amount || !selectedAssoId) {
      toast({
        variant: 'destructive',
        title: 'Champs manquants',
        description: 'Veuillez choisir une association et entrer un montant.',
      });
      return;
    }
    setProcessing(true);
    
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          associationId: selectedAssoId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'initialiser le paiement.");
      }
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: err.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const selectedAssociation = associations.find((a) => a.id === selectedAssoId);

  return (
    <Card className="border-2 border-primary/10 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Faire un don unique
        </CardTitle>
        <CardDescription>Soutenez une association instantanément via Stripe Connect.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientSecret ? (
          <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
            <CheckoutForm
              amount={amount!}
              selectedAssociation={selectedAssociation}
              setProcessing={setProcessing}
              onSuccessfulPayment={handleCreateDonation}
            />
            <Button 
              variant="ghost" 
              className="w-full mt-2 text-muted-foreground" 
              onClick={() => setClientSecret(null)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
          </Elements>
        ) : isLoading ? (
          <div className='space-y-4'>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Association bénéficiaire</label>
              <Select onValueChange={setSelectedAssoId} value={selectedAssoId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une association" />
                </SelectTrigger>
                <SelectContent>
                  {associations.length > 0 ? (
                    associations.map((asso) => (
                      <SelectItem key={asso.id} value={asso.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={asso.logoUrl || `https://picsum.photos/seed/${asso.id}/32/32`} alt={asso.associationName} data-ai-hint="charity logo"/>
                            <AvatarFallback>{asso.associationName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{asso.associationName}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Aucune association disponible</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Montant du don (€)</label>
              <Input
                type="number"
                placeholder="Ex: 10"
                value={amount === undefined ? '' : amount}
                onChange={handleAmountChange}
                min="1"
                className="text-lg font-semibold"
              />
            </div>
            <Button
              className="w-full from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110 shadow-lg shadow-amber-400/20 font-bold h-12"
              variant="vibrant"
              onClick={handleDonationClick}
              disabled={isProcessing || isLoading || !user || !amount || !selectedAssoId}
            >
              {isProcessing ? 'Chargement...' : 'Passer au paiement'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
