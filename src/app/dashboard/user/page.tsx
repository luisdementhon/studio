"use client";

import { HandHeart, PiggyBank, Coins } from 'lucide-react';
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
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, getDocs, query, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DonationForm } from '@/components/donation-form';
import { useEffect, useState } from 'react';
import type { Association } from '@/lib/schemas';


const chartData = [
  { month: 'Janvier', dons: 18.6 },
  { month: 'Février', dons: 20.5 },
  { month: 'Mars', dons: 19.3 },
  { month: 'Avril', dons: 22.1 },
  { month: 'Mai', dons: 24.9 },
  { month: 'Juin', dons: 23.7 },
];

const chartConfig = {
  dons: {
    label: 'Dons (€)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const recentTransactions = [
    { id: 1, merchant: "Carrefour City", amount: 0.78, date: "2024-07-21" },
    { id: 2, merchant: "Boulangerie 'Au bon pain'", amount: 0.20, date: "2024-07-21" },
    { id: 3, merchant: "Fnac", amount: 0.05, date: "2024-07-20" },
    { id: 4, merchant: "RATP", amount: 0.90, date: "2024-07-19" },
    { id: 5, merchant: "Starbucks", amount: 0.50, date: "2024-07-19" },
];


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

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    async function fetchAssociations() {
        if (!firestore) return;
        setAssociationsLoading(true);
        try {
            const associationsRef = collection(firestore, 'associations');
            const q = query(associationsRef, limit(10)); // Get a few associations
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

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Dons</h1>
        <p className="text-muted-foreground">Suivez l'impact de votre générosité.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Donné (ce mois-ci)
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23,70 €</div>
            <p className="text-xs text-muted-foreground">
              +18.2% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrondis de la semaine</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,45 €</div>
            <p className="text-xs text-muted-foreground">
              Sur 12 transactions
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
                  <Bar dataKey="dons" fill="var(--color-dons)" radius={4} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <DonationForm associations={associations} isLoading={associationsLoading} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Arrondis Récents</CardTitle>
          <CardDescription>Vos dernières transactions ayant généré un don.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commerçant</TableHead>
                <TableHead className="text-right">Montant Donné</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.merchant}</TableCell>
                  <TableCell className="text-right text-accent font-semibold">
                    {tx.amount.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString('fr-FR')}
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
