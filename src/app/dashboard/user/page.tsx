
"use client";

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { HandHeart, PiggyBank, Coins, ShieldCheck, Landmark, Calendar, Heart, Receipt, AlertCircle } from 'lucide-react';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { doc, collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { DonationForm } from '@/components/donation-form';
import { useEffect, useState, useMemo } from 'react';
import type { Association } from '@/lib/schemas';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { DotlyBrand } from '@/components/ui/dotly-brand';
import { toDate, initial, safeText, formatEuros, safeFormat } from '@/lib/utils';
import { SafeSection } from '@/components/error-boundary';

const chartConfig = {
  dons: {
    label: 'Dons (€)',
    color: 'hsl(var(--brand-coral))',
  },
} satisfies ChartConfig;

const causesLabels: { [key: string]: string } = {
  'environnement': 'Environnement',
  'pauvrete': 'Lutte contre la pauvreté',
  'sante': 'Santé & Recherche',
  'education': 'Éducation & Jeunesse',
  'animaux': 'Protection animale',
  'culture': 'Culture & Patrimoine',
  'humanitaire': 'Aide humanitaire',
  'social': 'Inclusion sociale',
  'autre': 'Autre'
};

type Period = '7j' | '30j' | '1an';

/** Une tuile de KPI. `isCount` distingue un compteur d'un montant en euros. */
type Kpi = {
  title: string;
  value: number;
  icon: typeof PiggyBank;
  color: string;
  sub: string;
  isCount?: boolean;
};

export default function UserDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationsLoading, setAssociationsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30j');


  // 1. Fetch user profile
  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  // 2. Fetch user's donations
  const donationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'donations'),
      orderBy('transactionDate', 'desc')
    );
  }, [firestore, user]);
  const { data: donations, isLoading: isDonationsLoading } = useCollection(donationsQuery);
  
  // 3. Fetch associations
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
                const data = doc.data() as any;
                // Une fiche sans nom est un profil incomplet, pas une
                // association : rien à proposer au donateur, et un `.charAt(0)`
                // sur un nom absent suffisait à vider tout le tableau de bord.
                if (!data.associationName) return;
                assos.push({ id: doc.id, ...data } as Association);
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

  // 5. Calculate KPIs and Chart Data based on period
  const {
    totalDonations,
    pendingRoundups,
    taxDeductibleAmount,
    chartData,
    recentDonations,
    userCauses
  } = useMemo(() => {

    if (!donations) {
        return { totalDonations: 0, pendingRoundups: 0, taxDeductibleAmount: 0, chartData: [], recentDonations: [], userCauses: null };
    }

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7j': startDate = subDays(now, 7); break;
      case '30j': startDate = subDays(now, 30); break;
      case '1an': startDate = subDays(now, 365); break;
    }

    // Seuls les dons réellement prélevés comptent. Un arrondi `pending`
    // n'a pas quitté le compte du donateur, et un `skipped_ceiling` ne le
    // quittera jamais : les additionner afficherait comme « versé » de
    // l'argent qui ne l'est pas — et fausserait la déduction fiscale.
    const filteredDonations = donations.filter(d => {
      if ((d as any).status !== 'succeeded') return false;
      const donationDate = toDate((d as any).transactionDate);
      return isAfter(donationDate, startOfDay(startDate));
    });

    const total = filteredDonations.reduce((acc, d) => acc + Number(d.amount || 0), 0);

    // Somme des arrondis en attente, lue en base : c'est ce que le
    // prélèvement mensuel encaissera réellement.
    const pendingTotal = donations
      .filter(d => (d as any).status === 'pending')
      .reduce((acc, d) => acc + Number((d as any).amount || 0), 0);

    // Regroupement pour le graphe, avec une clé triable (la clé affichée
    // « dd MMM » fusionnerait deux années différentes sur la période 1 an).
    const dailyData: { [key: string]: number } = {};
    filteredDonations.forEach(d => {
      const dateKey = format(toDate((d as any).transactionDate), 'yyyy-MM-dd');
      dailyData[dateKey] = (dailyData[dateKey] || 0) + Number((d as any).amount || 0);
    });

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dons]) => ({
        date: format(new Date(date), 'dd MMM', { locale: fr }),
        dons: parseFloat(dons.toFixed(2)),
      }));

    // Même exigence que pour les totaux : un arrondi en attente n'est pas une
    // « générosité » déjà effectuée, il ne doit pas figurer dans l'historique.
    const recent = donations
      .filter(d => (d as any).status === 'succeeded')
      .slice(0, 5)
      .map(d => {
        const asso = associations.find(a => a.id === d.associationId);
        const rawDate = (d as any).transactionDate;
        const dateObj = toDate(rawDate);
        return {
            ...d,
            associationName: asso?.associationName || 'Association inconnue',
            transactionDate: dateObj,
        }
    });

    return { 
      totalDonations: total, 
      // Les arrondis en attente viennent de Firestore, pas d'un recalcul à
      // la volée sur l'API Bridge : ce chiffre doit retomber à zéro après
      // un prélèvement, ce que le recalcul ne faisait jamais.
      pendingRoundups: pendingTotal,
      taxDeductibleAmount: total * 0.66, 
      chartData, 
      recentDonations: recent, 
      userCauses: userData 
    };

  }, [donations, associations, userData, period]);

  const isLoading = isUserLoading || isProfileLoading || isDonationsLoading;

  // Les trois conditions sans lesquelles la chaîne de l'arrondi ne démarre
  // pas. L'ordre est celui du parcours : banque, puis mandat, puis
  // bénéficiaire.
  const setupSteps = useMemo(() => {
    if (!userData) return [];
    const steps: { label: string; href: string; cta: string }[] = [];

    if (!(userData as any).bankConnected) {
      steps.push({
        label: 'Connecter votre compte bancaire, pour détecter vos paiements',
        href: '/dashboard/user/profile?tab=connexions',
        cta: 'Connecter ma banque',
      });
    }
    if (!(userData as any).paymentMethodLinked) {
      steps.push({
        label: 'Enregistrer une carte et signer votre mandat de prélèvement',
        href: '/dashboard/user/profile?tab=connexions',
        cta: 'Enregistrer ma carte',
      });
    }
    if (!((userData as any).associations?.length)) {
      steps.push({
        label: 'Choisir au moins une association bénéficiaire',
        href: '/dashboard/user/associations',
        cta: 'Choisir une association',
      });
    }
    if ((userData as any).mandateNeedsReauth) {
      steps.push({
        label: 'Confirmer à nouveau votre carte : votre banque a demandé une authentification',
        href: '/dashboard/user/profile?tab=connexions',
        cta: 'Reconfirmer ma carte',
      });
    }
    return steps;
  }, [userData]);

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-cascade" style={{ animationDelay: '100ms' }}>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-coral/10 text-brand-coral text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-coral"></span>
            </span>
            Tableau de Bord Donateur
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            Mon <span className="text-brand-coral">Impact.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-headline font-light max-w-xl">
            Retrouvez ici l'ensemble de vos contributions et l'évolution de votre générosité via <DotlyBrand className="inline text-base" />
          </p>
        </div>

        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-black/5 shadow-sm self-start">
          {(['7j', '30j', '1an'] as Period[]).map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-6 py-2 h-10 text-sm font-bold transition-all ${
                period === p 
                  ? 'bg-white shadow-md text-brand-coral scale-105' 
                  : 'text-muted-foreground hover:bg-black/5'
              }`}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Compte incomplet : sans banque, sans mandat ou sans association, pas
          un seul arrondi ne sera jamais collecté. Le tableau de bord affichait
          des zéros sans jamais dire pourquoi. */}
      {!isLoading && setupSteps.length > 0 && (
        <div className="rounded-[2rem] border-2 border-brand-coral/20 bg-brand-coral/5 p-8 animate-cascade" style={{ animationDelay: '150ms' }}>
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="flex gap-5">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-coral flex items-center justify-center shadow-lg shadow-brand-coral/20">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Votre compte n'est pas encore actif
                </h3>
                <p className="text-muted-foreground font-medium">
                  Tant que ces étapes ne sont pas terminées, aucun arrondi n'est collecté :
                </p>
                <ul className="space-y-1 text-sm font-medium text-foreground/80">
                  {setupSteps.map((step) => (
                    <li key={step.label} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-coral" />
                      {step.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button asChild className="rounded-2xl h-12 px-8 font-bold shrink-0 bg-brand-coral hover:bg-brand-coral/90 text-white">
              <Link href={setupSteps[0].href}>{setupSteps[0].cta}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <SafeSection label="kpis">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {([
          { title: 'Dons Versés', value: totalDonations, icon: PiggyBank, color: 'mint', sub: 'Total déjà reversé' },
          { title: 'Arrondis en cours', value: pendingRoundups, icon: Coins, color: 'coral', sub: 'Seront prélevés en fin de mois' },
          // `isCount` : sans lui, 1 association s'affichait « 1,00 € ».
          { title: 'Associations', value: userCauses?.associations?.length || 0, icon: Heart, color: 'teal', sub: 'Soutenues activement', isCount: true },
          { title: 'Réduction Fiscale', value: taxDeductibleAmount, icon: ShieldCheck, color: 'lavender', sub: 'Potentiel déductible (66%)' },
        ] satisfies Kpi[]).map((kpi, i) => (
          i === 1 ? (
            <Link key={i} href="/dashboard/user/history" className="block transition-transform hover:scale-[1.02] active:scale-[0.98] animate-cascade" style={{ animationDelay: `${200 + i * 100}ms` }}>
              <Card className="group rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white transition-all hover:shadow-2xl h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2.5 bg-brand-${kpi.color}/10 rounded-2xl transition-transform group-hover:rotate-12`}>
                    <kpi.icon className={`h-5 w-5 text-brand-${kpi.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoading ? (
                    <Skeleton className="h-10 w-2/3" />
                  ) : (
                    <div className="text-4xl font-headline font-extrabold text-foreground tabular-nums">
                      {kpi.isCount
                        ? kpi.value
                        : kpi.value?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "0,00 €"}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/60 font-medium mt-3 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {kpi.sub}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={i} className="group rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white transition-all hover:scale-[1.02] hover:shadow-2xl animate-cascade" style={{ animationDelay: `${200 + i * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">
                {kpi.title}
              </CardTitle>
              <div className={`p-2.5 bg-brand-${kpi.color}/10 rounded-2xl transition-transform group-hover:rotate-12`}>
                <kpi.icon className={`h-5 w-5 text-brand-${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-10 w-2/3" />
              ) : (
                <div className="text-4xl font-headline font-extrabold text-foreground tabular-nums">
                  {kpi.isCount
                    ? kpi.value || 0
                    : (kpi.value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
              )}
              <p className="text-xs text-muted-foreground/60 font-medium mt-3 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {kpi.sub}
              </p>
            </CardContent>
          </Card>
          )
        ))}
      </div>
      </SafeSection>

      <SafeSection label="causes">
      <div className="grid gap-6 md:grid-cols-2 animate-cascade" style={{ animationDelay: '600ms' }}>
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">Mes Causes</CardTitle>
            <div className="p-2.5 bg-brand-yellow/10 rounded-2xl">
              <HandHeart className="h-5 w-5 text-brand-yellow" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                  {userCauses?.causes?.map((causeId: string) => (
                    <Badge key={causeId} variant="secondary" className="rounded-full bg-muted/40 border-none px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground association-chip cursor-pointer">
                      {causesLabels[causeId] || causeId}
                    </Badge>
                  ))}
                  {(!userCauses?.causes || userCauses.causes.length === 0) && (
                      <p className="text-sm text-muted-foreground font-headline font-light lowercase">aucune cause sélectionnée</p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </SafeSection>

      {/* Chart and Form Section */}
      <div className="grid gap-10 lg:grid-cols-12">
        <SafeSection label="graphe-dons">
        <Card className="lg:col-span-8 rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white p-8">
          <CardHeader className="px-2 pb-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Activité des dons</CardTitle>
                <CardDescription className="text-lg font-headline font-light mt-1">Répartition de vos contributions dans le temps.</CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-brand-coral/5 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-brand-coral animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
                <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
            ) : chartData.length === 0 ? (
                <div className="h-[400px] w-full flex flex-col items-center justify-center text-center px-8">
                  <div className="h-20 w-20 rounded-full bg-brand-coral/5 flex items-center justify-center mb-6">
                    <PiggyBank className="h-10 w-10 text-brand-coral/40" />
                  </div>
                  <p className="text-xl font-headline font-bold text-foreground/80 mb-2">Pas encore d'activité</p>
                  <p className="text-sm text-muted-foreground max-w-sm">Votre historique de dons apparaîtra ici dès votre première contribution.</p>
                </div>
            ) : (
            <div className="h-[400px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--brand-coral))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--brand-coral))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="8 8" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#999', fontSize: 12, fontWeight: 600 }}
                    tickMargin={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#999', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(val) => `${val}€`}
                    tickMargin={20}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent indicator="line" />}
                    cursor={{ stroke: 'hsl(var(--brand-coral))', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="dons" 
                    stroke="hsl(var(--brand-coral))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorDons)" 
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            )}
          </CardContent>
        </Card>
        </SafeSection>

        <div className="lg:col-span-4">
          <SafeSection label="formulaire-don">
            <DonationForm associations={associations} isLoading={associationsLoading} />
          </SafeSection>
        </div>
      </div>
      
      {/* Recent Donations Table */}
      <SafeSection label="historique-recent">
      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white overflow-hidden">
        <CardHeader className="p-12 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-4xl font-headline font-extrabold tracking-tight">Historique Récent</CardTitle>
              <CardDescription className="text-xl font-headline font-light mt-2">Détail de vos dernières générosités.</CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-2xl border-black/5 hover:bg-black/5 font-bold h-12 px-8">
              <Link href="/dashboard/user/history">Tout voir</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-black/[0.02] border-none">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">
                    Association
                </TableHead>
                <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Montant</TableHead>
                <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-black/[0.05]">
                        <TableCell className="px-12 py-8"><Skeleton className="h-8 w-64 rounded-lg" /></TableCell>
                        <TableCell className="px-12 py-8"><Skeleton className="h-8 w-24 ml-auto rounded-lg" /></TableCell>
                        <TableCell className="px-12 py-8"><Skeleton className="h-8 w-32 ml-auto rounded-lg" /></TableCell>
                    </TableRow>
                  ))
              ) : recentDonations.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="py-20">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 rounded-full bg-brand-coral/5 flex items-center justify-center mb-6 animate-pulse">
                                <Heart className="h-8 w-8 text-brand-coral/40" />
                            </div>
                            <p className="text-2xl font-headline font-bold text-foreground/80 mb-2">Aucun don pour l'instant</p>
                            <p className="text-sm text-muted-foreground max-w-md mb-6">Faites votre premier don et il apparaîtra ici. Chaque centime compte.</p>
                        </div>
                    </TableCell>
                </TableRow>
              ) : (
                recentDonations.map((tx) => (
                    <TableRow key={tx.id} className="group hover:bg-black/[0.01] border-black/[0.03] transition-all">
                      <TableCell className="px-12 py-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center font-headline font-extrabold text-brand-coral group-hover:scale-110 transition-transform">
                            {initial(tx.associationName, 'A')}
                          </div>
                          <span className="font-headline font-extrabold text-2xl tracking-tight">{safeText(tx.associationName, 'Association inconnue')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-12 py-8">
                          <span className="inline-flex px-6 py-2.5 rounded-full bg-brand-coral/10 text-brand-coral font-extrabold text-xl tabular-nums">
                              {formatEuros(tx.amount)}
                          </span>
                      </TableCell>
                      <TableCell className="text-right px-12 py-8 text-muted-foreground font-bold text-base">
                          {safeFormat(tx.transactionDate, 'd MMM yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {recentDonations.length > 0 && (
            <div className="p-12 pt-8 text-center border-t border-black/[0.03]">
              <p className="text-sm text-muted-foreground font-medium">
                Vos <span className="text-brand-coral font-bold">{recentDonations.length}</span> derniers dons versés.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </SafeSection>
    </div>
  );
}
