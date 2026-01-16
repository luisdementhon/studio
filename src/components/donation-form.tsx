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
import { useUser, useFirestore } from '@/firebase';
import { collection, serverTimestamp, addDoc, doc, setDoc } from 'firebase/firestore';


const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  amount: number;
  selectedAssociation: Association | undefined;
  setProcessing: (isProcessing: boolean) => void;
  onSuccessfulPayment: () => Promise<void>;
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
        await onSuccessfulPayment();
    } else {
        setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        className="w-full mt-4"
        variant="vibrant"
        disabled={!stripe || !elements}
        type="submit"
      >
        Payer {amount} €
      </Button>
    </form>
  );
}

export function DonationForm({ associations, isLoading }: DonationFormProps) {
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

  const handleCreateDonation = async () => {
    if (!amount || !selectedAssoId || !user || !firestore) {
      toast({ variant: 'destructive', title: 'Erreur interne', description: 'Données manquantes pour l\'enregistrement.' });
      setProcessing(false);
      return;
    }

    const donationData = {
        userId: user.uid,
        associationId: selectedAssoId,
        amount: amount,
        transactionDate: serverTimestamp(),
        isRecurring: false,
    };

    try {
      // 1. Write to user's private subcollection
      const userDonationsRef = collection(firestore, 'users', user.uid, 'donations');
      const newDocRef = await addDoc(userDonationsRef, donationData);
      
      // 2. Write a copy to the association's public subcollection using the same ID
      const associationDonationsRef = doc(firestore, 'associations', selectedAssoId, 'donations', newDocRef.id);
      await setDoc(associationDonationsRef, donationData);

      toast({
          title: "Paiement réussi !",
          description: "Votre don a bien été enregistré. Merci !",
      });
      // Reset form state after successful donation
      setClientSecret(null);
      setAmount(undefined);
      setSelectedAssoId(undefined);
    } catch (error) {
      console.error("Failed to save donation record:", error);
      toast({
          variant: 'destructive',
          title: 'Erreur d\'enregistrement',
          description: 'Votre don a été traité mais nous n\'avons pas pu l\'enregistrer. Veuillez contacter le support.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDonationClick = async () => {
    if (!amount || !selectedAssoId) {
      toast({
        variant: 'destructive',
        title: 'Champs manquants',
        description:
          'Veuillez choisir une association et entrer un montant.',
      });
      return;
    }
    setProcessing(true);
    const selectedAssociation = associations.find(
      (a) => a.id === selectedAssoId
    );
    const res = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        associationName: selectedAssociation?.associationName,
      }),
    });

    const { clientSecret, error } = await res.json();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur serveur',
        description: error,
      });
      setProcessing(false);
    } else {
      setClientSecret(clientSecret);
    }
  };

  const selectedAssociation = associations.find((a) => a.id === selectedAssoId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faire un don unique</CardTitle>
        <CardDescription>Soutenez une association instantanément.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clientSecret ? (
          <Elements options={{ clientSecret }} stripe={stripePromise}>
            <CheckoutForm
              amount={amount!}
              selectedAssociation={selectedAssociation}
              setProcessing={setProcessing}
              onSuccessfulPayment={handleCreateDonation}
            />
          </Elements>
        ) : isLoading ? (
          <div className='space-y-4'>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <Select onValueChange={setSelectedAssoId} value={selectedAssoId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une association" />
              </SelectTrigger>
              <SelectContent>
                {associations.map((asso) => (
                  <SelectItem key={asso.id} value={asso.id}>
                    {asso.associationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Montant en €"
              value={amount === undefined ? '' : amount}
              onChange={handleAmountChange}
              min="1"
            />
            <Button
              className="w-full"
              variant="vibrant"
              onClick={handleDonationClick}
              disabled={isProcessing || isLoading || !user}
            >
              {isProcessing ? 'Chargement...' : 'Faire un don'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
