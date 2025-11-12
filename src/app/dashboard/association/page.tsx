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
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, XAxis, YAxis, Area, CartesianGrid, ResponsiveContainer } from 'recharts';

const chartData = [
  { date: '24/06', total: 245 },
  { date: '25/06', total: 280 },
  { date: '26/06', total: 320 },
  { date: '27/06', total: 290 },
  { date: '28/06', total: 350 },
  { date: '29/06', total: 410 },
  { date: '30/06', total: 430 },
];

const chartConfig = {
  total: {
    label: 'Total (€)',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const recentDonors = [
  { id: 1, name: "Jean D.", amount: 5.45, date: "2024-07-21" },
  { id: 2, name: "Marie L.", amount: 12.10, date: "2024-07-21" },
  { id: 3, name: "Anonyme", amount: 2.30, date: "2024-07-20" },
  { id: 4, name: "Claire M.", amount: 8.90, date: "2024-07-19" },
  { id: 5, name: "Anonyme", amount: 20.00, date: "2024-07-19" },
];

export default function AssociationDashboardPage() {
  const fundraisingGoal = 50000;
  const currentFunds = 28750;
  const progressPercentage = (currentFunds / fundraisingGoal) * 100;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Suivez les dons et l'engagement de votre communauté.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fonds Récoltés (ce mois-ci)
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,850.20 €</div>
            <p className="text-xs text-muted-foreground">
              +20.1% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Donateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+132</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Don Moyen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,75 €</div>
            <p className="text-xs text-muted-foreground">
              Sur toutes les donations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain virement</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">01/08/2024</div>
            <p className="text-xs text-muted-foreground">
              Montant estimé : ~1,200 €
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
            <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold">{currentFunds.toLocaleString('fr-FR')}€</span>
                <span className="text-sm text-muted-foreground">/ {fundraisingGoal.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="space-y-2">
                <Progress value={progressPercentage} />
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
                    {donor.amount.toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(donor.date).toLocaleDateString('fr-FR')}
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
