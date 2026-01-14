
"use client";

import { Users, PiggyBank, Target, Calendar } from 'lucide-react';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, XAxis, YAxis, Area, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collectionGroup, query, where, orderBy, limit } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [nextPayout, setNextPayout] = useState({ date: '', amount: '' });
  
  const isDemoMode = user?.isAnonymous;

  // 1. Fetch association profile data
  const associationDocRef = useMemoFirebase(() => {
    if (!user || isDemoMode) return null;
    return doc(firestore, 'associations', user.uid);
  }, [firestore, user, isDemoMode]);
  const { data: associationData, isLoading: isAssociationLoading } = useDoc(associationDocRef);
  
  // 2. Fetch donations for this association using a collectionGroup query
  const donationsQuery = useMemoFirebase(() => {
    return query(
      collectionGroup(firestore, 'donations'),
      where('associationId', '==', user.uid),
      orderBy('transactionDate', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const { data: donations, isLoading: isDonationsLoading } = useCollection(isDemoMode ? null : donationsQuery);

  // 3. Calculate KPIs from the data
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
      const donationDate = donation.transactionDate.toDate(); // Convert Firestore Timestamp to Date
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
        name: "Donateur Anonyme", // We can't fetch user names here for performance/privacy
        amount: d.amount,
        date: d.transactionDate.toDate().toLocaleDateString('fr-FR')
    }));

    return { monthlyFunds, monthlyFundsGrowth, uniqueDonors: donorIds.size, averageDonation, totalFunds, chartData, recentDonors };
  }, [donations, isDemoMode]);

  // Calculate next payout on client to avoid hydration issues
  useEffect(() => {
    if (isDemoMode) {
        const nextPayoutDate = new Date();
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
        nextPayoutDate.setDate(1);
        setNextPayout({
            date: format(nextPayoutDate, 'dd/MM/yyyy'),
            amount: `~5 210,00 €`
        });
        return;
    }
    if (donations) {
        const nextPayoutDate = new Date();
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
        nextPayoutDate.setDate(1);

        const estimatedAmount = monthlyFunds * (0.95); // Simulate a more stable estimation

        setNextPayout({
            date: format(nextPayoutDate, 'dd/MM/yyyy'),
            amount: `~${estimatedAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
        });
    }
  }, [donations, monthlyFunds, isDemoMode]);

  const fundraisingGoal = isDemoMode ? 100000 : (associationData?.fundraisingGoal || 1); // Avoid division by zero
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
        <div className="grid gap-8 md:grid-cols-5">
            <Skeleton className="h-96 md:col-span-3" />
            <Skeleton className="h-96 md:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Suivez les dons et l'engagement de votre communauté.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              Fonds Récoltés (ce mois-ci)
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyFunds.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <p className={`text-xs ${monthlyFundsGrowth >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {monthlyFundsGrowth >= 0 ? '+' : ''}{monthlyFundsGrowth.toFixed(1)}% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Donateurs Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDonors}</div>
            <p className="text-xs text-muted-foreground">
              Depuis le début
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Don Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDonation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <p className="text-xs text-muted-foreground">
              Sur toutes les donations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Prochain virement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextPayout.date}</div>
            <p className="text-xs text-muted-foreground">
              Montant estimé : {nextPayout.amount}
            </p>
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
                <AreaChart data={chartData} accessibilityLayer margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <defs>
                      <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1}/>
                      </linearGradient>
                  </defs>
                  <Area dataKey="total" type="natural" fill="url(#fillTotal)" stroke="var(--color-total)" stackId="a" />
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
                <p className="text-center text-sm text-muted-foreground">{progressPercentage.toFixed(1)}% de l'objectif atteint</p>
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
              {recentDonors.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">{donor.name}</TableCell>
                  <TableCell className="text-right text-accent font-semibold">
                    {donor.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {donor.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    
