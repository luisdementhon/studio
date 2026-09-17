
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
import { useUser } from '@/firebase';
import { authedFetch } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Heart } from 'lucide-react';
import { initial, safeText } from '@/lib/utils';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        className="w-full h-16 rounded-[1.5rem] text-lg font-extrabold shadow-xl shadow-brand-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        variant="vibrant"
        disabled={!stripe || !elements}
        type="submit"
      >
        Confirmer le don de {amount} €
      </Button>
    </form>
  );
}

export function DonationForm({ associations, isLoading }: { associations: Association[], isLoading: boolean }) {
  const { toast } = useToast();
  const { user } = useUser();

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
    // Le don lui-même est enregistré côté serveur par le webhook Stripe
    // (seule source fiable : le client ne doit jamais pouvoir écrire un don).
    // On se contente ici de confirmer visuellement et de réinitialiser le formulaire.
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
      const res = await authedFetch('/api/create-payment-intent', {
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
    <Card className="rounded-[3.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
      <CardHeader className="p-10 pb-4">
        <div className="h-14 w-14 rounded-2xl bg-brand-coral/10 flex items-center justify-center mb-6">
          <Heart className="h-7 w-7 text-brand-coral fill-brand-coral" />
        </div>
        <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">
          Don Unique
        </CardTitle>
        <CardDescription className="text-lg font-headline font-light leading-relaxed">
          Soutenez une cause instantanément. Simple, rapide et sécurisé.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-10 pt-4 space-y-8">
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
              className="w-full mt-4 h-14 rounded-2xl text-muted-foreground font-bold hover:bg-black/5" 
              onClick={() => setClientSecret(null)}
              disabled={isProcessing}
            >
              Retour
            </Button>
          </Elements>
        ) : isLoading ? (
          <div className='space-y-6'>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Bénéficiaire</label>
              <Select onValueChange={setSelectedAssoId} value={selectedAssoId}>
                <SelectTrigger className="w-full h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-lg font-medium focus:ring-2 focus:ring-brand-coral/20 transition-all">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                  {associations.length > 0 ? (
                    associations.map((asso) => (
                      <SelectItem key={asso.id} value={asso.id} className="rounded-xl h-14 cursor-pointer focus:bg-brand-coral/5 focus:text-brand-coral transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-xl border border-black/5">
                            <AvatarImage src={asso.logoUrl || `https://picsum.photos/seed/${asso.id}/64/64`} alt={safeText(asso.associationName, 'Association')} />
                            <AvatarFallback className="bg-brand-coral/5 text-brand-coral font-extrabold">{initial(asso.associationName, 'A')}</AvatarFallback>
                          </Avatar>
                          <span className="font-headline font-extrabold text-lg tracking-tight">{safeText(asso.associationName, 'Association sans nom')}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-muted-foreground text-center font-light font-serif italic font-bold">Aucune association disponible</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Montant (€)</label>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount === undefined ? '' : amount}
                  onChange={handleAmountChange}
                  min="1"
                  className="h-16 rounded-[1.5rem] bg-black/[0.03] border-none px-6 text-2xl font-extrabold focus:ring-2 focus:ring-brand-coral/20 transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 font-extrabold text-xl pointer-events-none group-focus-within:text-brand-coral transition-colors">€</div>
              </div>
            </div>
            <Button
              className="w-full h-16 rounded-[1.5rem] text-lg font-extrabold shadow-xl shadow-brand-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              variant="vibrant"
              onClick={handleDonationClick}
              disabled={isProcessing || isLoading || !user || !amount || !selectedAssoId}
            >
              {isProcessing ? 'Connexion...' : 'Soutenir maintenant'}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground/50 font-headline font-light uppercase tracking-widest">
              Sécurisé par <span className="font-headline font-extrabold">Stripe</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
