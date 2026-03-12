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
import { useUser, useFirestore, useDoc, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const chartConfig = {
  total: {
    label: 'Total (€)',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const demoChartData = [
    { date: format(subDays(new Date(), 6), 'dd/MM', { locale: fr }), total: 150 },
    { date: format(subDays(new Date(), 5), 'dd/MM', { locale: fr }), total: 120 },
    { date: format(subDays(new Date(), 4), 'dd/MM', { locale: fr }), total: 200 },
    { date: format(subDays(new Date(), 3), 'dd/MM', { locale: fr }), total: 180 },
    { date: format(subDays(new Date(), 2), 'dd/MM', { locale: fr }), total: 250 },
    { date: format(subDays(new Date(), 1), 'dd/MM', { locale: fr }), total: 230 },
    { date: format(new Date(), 'dd/MM', { locale: fr }), total: 300 },
];

const demoRecentDonors = [
    { id: '1', name: 'Jean Dupont', amount: 2.50, date: format(new Date(), 'dd/MM/yyyy') },
    { id: '2', name: 'Marie Curie', amount: 5.00, date: format(subDays(new Date(), 1), 'dd/MM/yyyy') },
    { id: '3', name: 'Pierre Martin', amount: 1.20, date: format(subDays(new Date(), 1), 'dd/MM/yyyy') },
    { id: '4', name: 'Sophie Lemoine', amount: 10.00, date: format(subDays(new Date(), 2), 'dd/MM/yyyy') },
    { id: '5', name: 'Luc Durand', amount: 0.80, date: format(subDays(new Date(), 3), 'dd/MM/yyyy') },
];

export default function AssociationDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [nextPayout, setNextPayout] = useState({ date: '', amount: '' });
  const [isOnboardingStripe, setIsOnboardingStripe] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const isDemoMode = user?.isAnonymous;

  const associationDocRef = useMemo(() => {
    if (!firestore || !user || isDemoMode) return null;
    return doc(firestore, 'associations', user.uid);
  }, [firestore, user, isDemoMode]);
  
  const { data: associationData, isLoading: isAssociationLoading } = useDoc(associationDocRef);
  
  const donationsQuery = useMemo(() => {
    if (!firestore || !user || isDemoMode) return null;
    return query(
      collection(firestore, 'associations', user.uid, 'donations'),
      orderBy('transactionDate', 'desc'),
      limit(50)
    );
  }, [firestore, user, isDemoMode]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsQuery);

  const handleStripeOnboarding = async () => {
    if (!user || !associationDocRef) return;
    
    setIsOnboardingStripe(true);
    try {
      const response = await fetch('/api/stripe/connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ associationId: user.uid }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible de générer le lien Stripe.");
      }

      // 1. Enregistrement de l'ID Stripe côté client
      if (data.stripeAccountId) {
        updateDocumentNonBlocking(associationDocRef, { stripeAccountId: data.stripeAccountId });
      }

      // 2. Redirection vers Stripe
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

  const handleInitTestData = () => {
    if (!associationDocRef || !user) return;
    setIsInitializing(true);
    
    const testData = {
      id: user.uid,
      associationName: "Association Test",
      representativeName: "Test Admin",
      contactEmail: user.email || "test@example.com",
      rnaNumber: "W123456789",
      description: "Ceci est une association de test pour vérifier l'intégration Stripe Connect.",
      fundraisingGoal: 5000,
      currentMissions: "Phase de test technique",
      logoUrl: "",
      stripeAccountId: ""
    };

    setDocumentNonBlocking(associationDocRef, testData, { merge: true });
    
    toast({
      title: "Profil test créé",
      description: "Le document d'association a été initialisé dans Firestore.",
    });
    setIsInitializing(false);
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
    if (isDemoMode) {
        return {
            monthlyFunds: 5430.21,
            monthlyFundsGrowth: 15.2,
            uniqueDonors: 124,
            averageDonation: 4.38,
            totalFunds: 35230.90,
            chartData: demoChartData,
            recentDonors: demoRecentDonors,
        };
    }
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
      const donationDate = (donation as any).transactionDate?.toDate() || new Date();
      totalFunds += donation.amount;
      donorIds.add(donation.userId);
      
      if (donationDate >= startOfMonth) {
        monthlyFunds += donation.amount;
      }
      if (donationDate >= startOfLastMonth && donationDate <= endOfLastMonth) {
        lastMonthFunds += donation.amount;
      }

      const dayKey = format(donationDate, 'yyyy-MM-dd');
      if (dayKey in donationsByDay) {
          donationsByDay[dayKey] += donation.amount;
      }
    });

    const monthlyFundsGrowth = lastMonthFunds > 0 ? ((monthlyFunds - lastMonthFunds) / lastMonthFunds) * 100 : monthlyFunds > 0 ? 100 : 0;
    const averageDonation = donations.length > 0 ? totalFunds / donations.length : 0;

    const chartData = Object.keys(donationsByDay).map(date => ({
        date: format(new Date(date), 'dd/MM', { locale: fr }),
        total: donationsByDay[date],
    })).reverse();

    const recentDonors = donations.slice(0, 5).map(d => ({
        id: d.id,
        name: "Donateur Anonyme",
        amount: d.amount,
        date: (d as any).transactionDate?.toDate().toLocaleDateString('fr-FR') || format(new Date(), 'dd/MM/yyyy')
    }));

    return { monthlyFunds, monthlyFundsGrowth, uniqueDonors: donorIds.size, averageDonation, totalFunds, chartData, recentDonors };
  }, [donations, isDemoMode]);

  useEffect(() => {
    const nextPayoutDate = new Date();
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
    nextPayoutDate.setDate(1);
    setNextPayout({
        date: format(nextPayoutDate, 'dd/MM/yyyy'),
        amount: `~${(monthlyFunds * 0.95).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
    });
  }, [monthlyFunds]);

  const fundraisingGoal = isDemoMode ? 100000 : (associationData?.fundraisingGoal || 1);
  const progressPercentage = (totalFunds / fundraisingGoal) * 100;

  const isLoading = !isDemoMode && (isUserLoading || isAssociationLoading || isDonationsLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
      </div>
    )
  }

  if (!isDemoMode && !associationData && !isAssociationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="p-4 bg-amber-50 rounded-full">
          <AlertCircle className="h-12 w-12 text-amber-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold">Profil association manquant</h1>
          <p className="text-muted-foreground">
            Aucun document n'a été trouvé pour votre compte dans la collection "associations". 
            Souhaitez-vous initialiser un profil de test ?
          </p>
        </div>
        <Button 
          size="lg" 
          variant="vibrant" 
          onClick={handleInitTestData}
          disabled={isInitializing}
          className="from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110"
        >
          {isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Initialiser le profil de test
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            {isDemoMode ? "Mode Démonstration" : `Bienvenue, ${associationData?.associationName}`}
          </p>
        </div>
        
        <Card className="min-w-[300px] border-2 border-primary/10 shadow-lg">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Statut des paiements</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-0 px-4 pb-3">
            {associationData?.stripeAccountId ? (
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Paiements activés</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 ml-auto">Actif</Badge>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground mb-1">Votre compte n'est pas lié à Stripe Connect.</p>
                <Button 
                  size="sm" 
                  className="w-full h-10 text-xs from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110 font-bold" 
                  variant="vibrant"
                  onClick={handleStripeOnboarding}
                  disabled={isOnboardingStripe}
                >
                  {isOnboardingStripe ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Configurer mes paiements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fonds Récoltés (mois)</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyFunds.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <p className={`text-xs ${monthlyFundsGrowth >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {monthlyFundsGrowth >= 0 ? '+' : ''}{monthlyFundsGrowth.toFixed(1)}% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donateurs Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDonors}</div>
            <p className="text-xs text-muted-foreground">Sur la durée totale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Don Moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDonation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-muted-foreground">Sur {donations?.length || 0} dons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain virement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextPayout.date}</div>
            <p className="text-xs text-muted-foreground">Estimé à {nextPayout.amount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Évolution des dons journaliers</CardTitle>
            <CardDescription>Dons reçus au cours de la dernière semaine.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => `€${value}`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <defs>
                      <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1}/>
                      </linearGradient>
                  </defs>
                  <Area dataKey="total" type="natural" fill="url(#fillTotal)" stroke="var(--color-total)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Objectif Annuel</CardTitle>
            <CardDescription>Progrès vers votre objectif de collecte.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-4 h-full">
            <div className="flex flex-wrap items-baseline justify-center gap-2">
                <span className="text-3xl font-bold">{totalFunds.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                <span className="text-sm text-muted-foreground">/ {fundraisingGoal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <div className="space-y-2">
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-center text-sm text-muted-foreground font-medium">{progressPercentage.toFixed(1)}% atteint</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Donateurs Récents</CardTitle>
          <CardDescription>Les dernières contributions à votre cause.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donateur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDonors.length > 0 ? recentDonors.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">{donor.name}</TableCell>
                  <TableCell className="text-right text-accent font-bold">
                    {donor.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {donor.date}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Aucun donateur pour le moment.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
