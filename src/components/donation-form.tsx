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
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface DonationFormProps {
  associations: Association[];
  isLoading: boolean;
}

function CheckoutForm({
  amount,
  selectedAssociation,
  setProcessing,
  onSuccessfulPayment,
}: {
  amount: number;
  selectedAssociation: Association | undefined;
  setProcessing: (isProcessing: boolean) => void;
  onSuccessfulPayment: () => void;
}) {
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

    // Le `paymentIntent` est déjà créé à l'étape précédente,
    // il suffit de le confirmer ici.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Ne redirige que si nécessaire (ex: 3D Secure)
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: error.message,
      });
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccessfulPayment(); // Appeler la fonction de callback ici
        toast({
            title: "Paiement réussi !",
            description: "Votre don a bien été enregistré. Merci !",
        });
    } else {
        // Gérer d'autres statuts si nécessaire
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
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? undefined : value);
  };

  const handleCreateDonation = async () => {
    if (!amount || !selectedAssoId || !user) {
      // This should not happen if the logic is correct, but it's a safe guard.
      console.error("Missing data to create donation record");
      return;
    }

    const donationData = {
        userId: user.uid,
        associationId: selectedAssoId,
        amount: amount,
        transactionDate: serverTimestamp(),
        isRecurring: false, // For single donations
    };

    const donationsRef = collection(firestore, 'donations');
    addDocumentNonBlocking(donationsRef, donationData);
    
    // Reset form state after successful donation
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
    // Processing state will be reset inside CheckoutForm
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
