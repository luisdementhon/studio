
"use client";

import { HandHeart, PiggyBank, Coins, ShieldCheck, Landmark } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart as RechartsBarChart, XAxis, YAxis, Bar, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, getDocs, query, limit, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DonationForm } from '@/components/donation-form';
import { useEffect, useState, useMemo } from 'react';
import type { Association } from '@/lib/schemas';
import { format, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';


const chartConfig = {
  dons: {
    label: 'Dons (€)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const causesLabels: { [key: string]: string } = {
  environnement: "Environnement",
  precarite: "Précarité",
  education: "Éducation",
  sante: "Santé",
  animaux: "Cause animale",
};

export default function UserDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationsLoading, setAssociationsLoading] = useState(true);

  // 1. Fetch user profile
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  // 2. Fetch user's donations
  const donationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'donations'),
      where('userId', '==', user.uid),
      orderBy('userId'), // Added for security rule compliance
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, user]);
  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsQuery);
  
  // 3. Fetch associations for donation form and donation list
  useEffect(() => {
    async function fetchAssociations() {
        if (!firestore) return;
        setAssociationsLoading(true);
        try {
            const associationsRef = collection(firestore, 'associations');
            const q = query(associationsRef, limit(20));
            const querySnapshot = await getDocs(q);
            const assos: Association[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter out the test association
                if (data.associationName?.toLowerCase() !== 'prout') {
                    assos.push({ id: doc.id, ...data } as Association);
                }
            });
            setAssociations(assos);
        } catch (error) {
            console.error("Failed to fetch associations:", error);
        } finally {
            setAssociationsLoading(false);
        }
    }
    fetchAssociations();
  }, [firestore]);


  // 4. Calculate KPIs from dynamic data
  const {
    monthlyDonation,
    taxDeductibleAmount,
    chartData,
    recentDonations,
    weeklyRoundups,
  } = useMemo(() => {
    if (!donations) {
        return { monthlyDonation: 0, taxDeductibleAmount: 0, chartData: [], recentDonations: [], weeklyRoundups: 0 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let monthlyDonation = 0;
    const monthlyTotals: number[] = Array(6).fill(0);
    const monthLabels: string[] = [];

    // Initialize month labels for the last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push(format(d, 'MMMM', { locale: fr }));
    }

    donations.forEach(d => {
        const donationDate = new Date(d.transactionDate);
        if (donationDate >= startOfMonth) {
            monthlyDonation += d.amount;
        }

        // Aggregate data for the chart
        const monthDiff = (now.getFullYear() - donationDate.getFullYear()) * 12 + (now.getMonth() - donationDate.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
            monthlyTotals[5 - monthDiff] += d.amount;
        }
    });

    const taxDeductibleAmount = monthlyDonation * 0.66;
    
    const chartData = monthlyTotals.map((total, index) => ({
        month: monthLabels[index],
        dons: parseFloat(total.toFixed(2)),
    }));

    const recentDonationsWithAssoName = donations.slice(0, 5).map(d => {
        const asso = associations.find(a => a.id === d.associationId);
        return {
            ...d,
            associationName: asso?.associationName || 'Association inconnue',
        }
    });

    // Mock weekly roundups since transaction data isn't available
    const weeklyRoundups = donations.length > 0 ? (monthlyDonation / 4) * (Math.random() * 0.5 + 0.75) : 0;

    return { monthlyDonation, taxDeductibleAmount, chartData, recentDonations: recentDonationsWithAssoName, weeklyRoundups };

  }, [donations, associations]);


  const isLoading = isUserLoading || isProfileLoading || isDonationsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Dons</h1>
        <p className="text-muted-foreground">Suivez l'impact de votre générosité.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donné (ce mois-ci)
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-2/3" /> : <div className="text-2xl font-bold">{monthlyDonation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>}
            <p className="text-xs text-muted-foreground">
              Merci pour votre générosité !
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrondis de la semaine</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{weeklyRoundups.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>}
            <p className="text-xs text-muted-foreground">
              (Estimation)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avantage Fiscal (estimation)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{taxDeductibleAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>}
            <p className="text-xs text-muted-foreground">
              66% de vos dons mensuels
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Causes Soutenues</CardTitle>
            <HandHeart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2">
                  {userData?.causes?.map((causeId: string) => (
                    <Badge key={causeId} variant="secondary">{causesLabels[causeId] || causeId}</Badge>
                  ))}
                  {userData?.otherCause && <Badge variant="secondary">{userData.otherCause}</Badge>}
                  {(!userData?.causes || userData.causes.length === 0) && !userData?.otherCause && (
                      <p className="text-xs text-muted-foreground">Aucune cause sélectionnée.</p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historique des dons mensuels</CardTitle>
            <CardDescription>Évolution de vos dons au cours des 6 derniers mois.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-64 w-full" />
            ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer>
                <RechartsBarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
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
                      <linearGradient id="fillDons" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-dons)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-dons)" stopOpacity={0.1}/>
                      </linearGradient>
                  </defs>
                  <Bar dataKey="dons" fill="url(#fillDons)" radius={4} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
        <DonationForm associations={associations} isLoading={associationsLoading} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Dons Récents</CardTitle>
          <CardDescription>Vos dernières contributions via un don unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Association</TableHead>
                <TableHead className="text-right">Montant Donné</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
              ) : recentDonations.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Aucun don unique pour le moment.
                    </TableCell>
                </TableRow>
              ) : (
                recentDonations.map((tx) => (
                    <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.associationName}</TableCell>
                    <TableCell className="text-right text-accent font-semibold">
                        {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                        {format(new Date(tx.transactionDate), 'd MMM yyyy', { locale: fr })}
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
