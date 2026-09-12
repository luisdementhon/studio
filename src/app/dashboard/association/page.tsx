"use client";

import { Users, PiggyBank, Target, Calendar, CreditCard, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, XAxis, YAxis, Area, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { authedFetch } from '@/lib/api-client';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { subDays, format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { toDate } from '@/lib/utils';
import { PLATFORM_FEE_PERCENT } from '@/lib/fees';

// Safe date formatting helper
const safeFormat = (date: any, formatStr: string, options?: any) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isValid(d)) return "—";
    return format(d, formatStr, options);
  } catch (e) {
    return "—";
  }
};
import { useToast } from '@/hooks/use-toast';

const chartConfig = {
  total: {
    label: 'Total (€)',
    color: '#4ade80',
  },
} satisfies ChartConfig;

export default function AssociationDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [nextPayout, setNextPayout] = useState({ date: '', amount: '' });
  const [isOnboardingStripe, setIsOnboardingStripe] = useState(false);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [activePeriod, setActivePeriod] = useState('30j');
  

  const associationDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'associations', user.uid);
  }, [firestore, user]);
  
  const { data: associationData, isLoading: isAssociationLoading } = useDoc(associationDocRef);
  
  const donationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'associations', user.uid, 'donations'),
      orderBy('transactionDate', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsQuery);

  // Posséder un stripeAccountId ne veut pas dire pouvoir encaisser : le compte
  // est créé dès le premier clic. On interroge donc Stripe pour connaître
  // l'état réel, sinon une association ayant abandonné l'onboarding ne voit
  // plus aucune alerte et perd tous ses dons sans le savoir.
  useEffect(() => {
    if (!associationData?.stripeAccountId) return;
    authedFetch('/api/stripe/connect-status', { method: 'POST' })
      .then((r) => r.json())
      .then((s) => setStripeReady(Boolean(s?.chargesEnabled)))
      .catch(() => setStripeReady(false));
  }, [associationData?.stripeAccountId]);

  const handleStripeOnboarding = async () => {
    if (!user || !associationDocRef) return;
    
    setIsOnboardingStripe(true);
    try {
      const response = await authedFetch('/api/stripe/connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de générer le lien Stripe.");
      }

      // Le stripeAccountId est enregistré côté serveur par la route.
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: error.message,
      });
    } finally {
      setIsOnboardingStripe(false);
    }
  };

  const {
    monthlyFunds,
    monthlyFundsGrowth,
    uniqueDonors,
    averageDonation,
    totalFunds,
    chartData,
    recentDonors
  } = useMemo(() => {
    if (!donations) return {
        monthlyFunds: 0,
        monthlyFundsGrowth: 0,
        uniqueDonors: 0,
        averageDonation: 0,
        totalFunds: 0,
        chartData: [],
        recentDonors: [],
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let monthlyFunds = 0;
    let lastMonthFunds = 0;
    let totalFunds = 0;
    const donorIds = new Set<string>();
    
    const donationsByDay: {[key: string]: number} = {};
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const day = subDays(today, i);
        donationsByDay[format(day, 'yyyy-MM-dd')] = 0;
    }

    donations.forEach(donation => {
      // Un don remboursé n'est plus un don reçu : l'inclure gonflerait les
      // fonds récoltés, le don moyen et le nombre de donateurs.
      if ((donation as any).status === 'refunded') return;

      const amount = Number(donation.amount || 0);
      const rawDate = (donation as any).transactionDate;
      const donationDate = toDate(rawDate);
      totalFunds += amount;
      if ((donation as any).userId) donorIds.add((donation as any).userId);
      
      if (donationDate >= startOfMonth) {
        monthlyFunds += amount;
      }
      if (donationDate >= startOfLastMonth && donationDate <= endOfLastMonth) {
        lastMonthFunds += amount;
      }

      const dayKey = safeFormat(donationDate, 'yyyy-MM-dd');
      if (dayKey !== "—" && dayKey in donationsByDay) {
          donationsByDay[dayKey] += amount;
      }
    });

    const monthlyFundsGrowth = lastMonthFunds > 0 ? ((monthlyFunds - lastMonthFunds) / lastMonthFunds) * 100 : monthlyFunds > 0 ? 100 : 0;
    const countedDonations = donations.filter(d => (d as any).status !== 'refunded').length;
    const averageDonation = countedDonations > 0 ? totalFunds / countedDonations : 0;

    const chartData = Object.keys(donationsByDay).map(dateKey => {
        const dateObj = new Date(dateKey);
        return {
            date: safeFormat(dateObj, 'dd/MM', { locale: fr }),
            total: donationsByDay[dateKey],
        };
    }).reverse();

    const recentDonors = donations.slice(0, 5).map(d => {
        const rawDate = (d as any).transactionDate;
        const dateObj = toDate(rawDate);
        return {
            id: d.id,
            name: "Donateur Anonyme",
            amount: Number(d.amount || 0),
            date: dateObj.toLocaleDateString('fr-FR')
        };
    });

    return { monthlyFunds, monthlyFundsGrowth, uniqueDonors: donorIds.size, averageDonation, totalFunds, chartData, recentDonors };
  }, [donations]);

  useEffect(() => {
    // setDate(1) AVANT setMonth : sinon le 31 janvier + 1 mois donne un
    // 31 février, que JS normalise en 3 mars, et le virement est annoncé
    // avec un mois de retard.
    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(1);
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
    setNextPayout({
        date: safeFormat(nextPayoutDate, 'dd/MM/yyyy'),
        amount: `~${(monthlyFunds * (1 - PLATFORM_FEE_PERCENT / 100)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
    });
  }, [monthlyFunds]);

  const fundraisingGoal = associationData?.fundraisingGoal || 10000;

  // `totalReceived` est incrémenté atomiquement par le webhook Stripe et
  // couvre TOUS les dons. La somme locale ne porte que sur les 50 derniers :
  // l'afficher comme « total depuis le début » le figeait dès le 51e don.
  const lifetimeTotal = Number(associationData?.totalReceived ?? totalFunds);
  const progressPercentage = (lifetimeTotal / fundraisingGoal) * 100;

  const isLoading = isUserLoading || isAssociationLoading || isDonationsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-foreground">
          Bonjour, <span className="text-brand-coral font-serif italic font-bold">{(associationData as any)?.associationName || 'votre association'}</span> 🌿
        </h1>
        
        <div className="flex bg-black/[0.03] p-1.5 rounded-full border border-black/[0.05]">
          {['7j', '30j', '1an', 'Tout'].map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-6 py-2 rounded-full text-xs font-extrabold transition-all ${
                activePeriod === period 
                  ? 'bg-white text-foreground shadow-sm' 
                  : 'text-foreground/40 hover:text-foreground'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Sans compte Stripe connecté, l'association ne peut recevoir aucun don :
          les dons ponctuels sont refusés et le règlement mensuel l'ignore.
          C'est donc la première chose à régler, avant tout le reste. */}
      {(!associationData?.stripeAccountId || stripeReady === false) && (
        <div className="rounded-[2.5rem] border-2 border-brand-coral/20 bg-brand-coral/5 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-coral/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-brand-coral" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-headline font-extrabold tracking-tight">
                {associationData?.stripeAccountId
                  ? 'Terminez la configuration de votre compte'
                  : 'Configurez votre compte de paiement'}
              </h2>
              <p className="text-sm text-foreground/60 font-headline font-light leading-relaxed max-w-xl">
                {associationData?.stripeAccountId
                  ? "Votre inscription chez Stripe n'est pas finalisée : tant qu'elle ne l'est pas, aucun don ne peut vous être versé. Reprenez là où vous vous étiez arrêté."
                  : "Tant que votre compte Stripe n'est pas connecté, vous ne pouvez recevoir aucun don. La configuration prend quelques minutes et se fait directement chez Stripe."}
              </p>
            </div>
          </div>
          <Button
            onClick={handleStripeOnboarding}
            disabled={isOnboardingStripe}
            variant="vibrant"
            className="h-14 shrink-0 rounded-2xl px-8 font-bold shadow-lg shadow-brand-coral/20"
          >
            {isOnboardingStripe ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection…
              </>
            ) : (
              <>
                {associationData?.stripeAccountId ? 'Reprendre la configuration' : 'Connecter mon compte'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-coral text-white rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-60">FONDS RÉCOLTÉS CE MOIS-CI</span>
          <div>
            <div className="text-4xl md:text-5xl font-extrabold mb-2 truncate">{(monthlyFunds || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            {monthlyFundsGrowth > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
                <span className="opacity-100">↑ {monthlyFundsGrowth.toFixed(1)}%</span>
                <span className="opacity-60">vs mois dernier</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-yellow rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40">DONATEURS UNIQUES</span>
          <div>
            <div className="text-4xl md:text-5xl font-extrabold mb-2 truncate">{uniqueDonors}</div>
          </div>
        </div>

        <div className="bg-brand-mint rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40">PROCHAIN VIREMENT</span>
          <div>
            <div className="text-4xl font-extrabold mb-1 truncate">{nextPayout?.date || '—'}</div>
            <p className="text-sm font-bold opacity-40">Estimation : {nextPayout?.amount || '0,00 €'}</p>
          </div>
        </div>

        <div className="bg-brand-lavender rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40">DON MOYEN</span>
          <div>
            <div className="text-4xl md:text-5xl font-extrabold mb-2 truncate">{(averageDonation || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-black/[0.05] rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[200px] shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40">TOTAL DEPUIS LE DÉBUT</span>
            <div className="text-4xl md:text-5xl font-extrabold truncate">{lifetimeTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
          </div>
          
          <div className="bg-white border border-black/[0.05] rounded-[2.5rem] p-10 space-y-8 shadow-sm">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40 block mb-2">OBJECTIF ANNUEL</span>
              <div className="text-3xl font-extrabold truncate">{(fundraisingGoal || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-black/[0.03] rounded-full overflow-hidden p-1">
                <div className="h-full bg-brand-mint rounded-full transition-all duration-700" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-extrabold text-brand-mint">{progressPercentage.toFixed(0)}% atteint</span>
                <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Restant : {Math.max(fundraisingGoal - totalFunds, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-foreground text-white rounded-[3rem] p-10 shadow-xl overflow-hidden relative min-h-[440px]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-headline font-extrabold tracking-tight">Évolution hebdomadaire</h3>
              <p className="text-white/40 text-sm font-headline font-light mt-1">Dons collectés par jour sur les 7 derniers jours</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-64 w-full mt-12">
             <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotalDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB8B7B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FB8B7B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    dataKey="total" 
                    type="natural" 
                    fill="url(#colorTotalDashboard)" 
                    stroke="#FB8B7B" 
                    strokeWidth={4} 
                  />
                  <XAxis hide dataKey="date" />
                  <YAxis hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-black/[0.05] rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-10 flex justify-between items-center border-b border-black/[0.05]">
          <div>
            <h3 className="text-2xl font-headline font-extrabold tracking-tight">Donateurs récents</h3>
            <p className="text-foreground/40 text-sm font-headline font-light mt-1">Dernières contributions à <span className="font-serif italic font-bold">{(associationData as any)?.associationName || 'votre association'}</span></p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-black font-extrabold px-6"><Link href="/dashboard/association/donors">Voir tout</Link></Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground/30">
                <th className="px-10 py-6">DONATEUR</th>
                <th className="px-10 py-6">MONTANT</th>
                <th className="px-10 py-6">DATE</th>
                <th className="px-10 py-6 text-right">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {recentDonors.map((donor) => (
                <tr key={donor.id} className="hover:bg-black/[0.01] transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center font-extrabold text-xs">
                        {donor.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold">{donor.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 font-extrabold">{donor.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "0,00 €"}</td>
                  <td className="px-10 py-6 text-foreground/40 font-bold">{donor.date}</td>
                  <td className="px-10 py-6 text-right">
                    <span className="px-4 py-1.5 rounded-full bg-brand-mint/20 text-brand-mint text-[10px] font-extrabold uppercase tracking-widest">
                      TRANSFÉRÉ
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
