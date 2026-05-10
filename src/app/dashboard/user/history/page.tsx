"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Info, Loader2, RefreshCcw, Link2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DotlyBrand } from "@/components/ui/dotly-brand";

export default function TransactionHistoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    setWarning(null);
    
    try {
      const response = await fetch("/api/bridge/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, userId: user.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de récupérer les transactions.");
      }

      setTransactions(data.transactions || []);
      setTotalDonations(data.totalDonations || 0);
      if (data.warning) {
        setWarning(data.warning);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchTransactions();
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            Mes<br />
            <DotlyBrand />
          </h1>
          <p className="text-lg text-muted-foreground font-headline font-light max-w-xl">
            Suivez l'origine de chaque centime collecté pour vos causes via <DotlyBrand className="inline text-base" />
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={fetchTransactions} 
            disabled={loading}
            variant="outline" 
            className="rounded-2xl border-black/5 hover:bg-black/5 font-bold h-12 px-6"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
          <div className="bg-brand-coral/10 text-brand-coral px-6 py-3 rounded-2xl font-headline font-extrabold text-xl">
            Total : {totalDonations.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white overflow-hidden">
        <CardHeader className="p-12 pb-8">
            <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Détail des arrondis</CardTitle>
            <CardDescription className="text-lg font-headline font-light mt-2">Transactions bancaires récentes et calculs associés.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-red-50 rounded-full mb-4">
                    <Info className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={fetchTransactions} variant="vibrant">Réessayer</Button>
            </div>
          ) : warning ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-brand-coral/5 rounded-full mb-4">
                    <Link2 className="h-8 w-8 text-brand-coral" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Banque non connectée</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">{warning}</p>
                <Button asChild variant="vibrant">
                    <Link href="/dashboard/user/profile?tab=connexions">Connecter ma banque</Link>
                </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-muted/20 rounded-full mb-4">
                    <Banknote className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Aucune transaction</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">Connectez votre banque ou attendez que vos premiers achats apparaissent.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/[0.02] border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Date</TableHead>
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Description</TableHead>
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Catégorie</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Achat</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Arrondi</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Impact Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} className="group hover:bg-black/[0.01] border-black/[0.03] transition-all">
                    <TableCell className="px-12 py-6 font-medium text-muted-foreground">
                      {t.date ? (
                        (() => {
                          try {
                            return format(new Date(t.date), 'dd MMM yyyy', { locale: fr });
                          } catch (e) {
                            return t.date;
                          }
                        })()
                      ) : 'Date inconnue'}
                    </TableCell>
                    <TableCell className="px-12 py-6">
                      <div className="font-bold text-foreground">{t.description}</div>
                      <div className="text-xs text-muted-foreground">{t.bankName}</div>
                    </TableCell>
                    <TableCell className="px-12 py-6">
                      <Badge variant="secondary" className="rounded-lg bg-muted/30 border-none font-bold uppercase text-[9px] tracking-wider px-2">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-12 py-6 font-bold tabular-nums">
                      {Number(t.amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right px-12 py-6 text-muted-foreground font-medium tabular-nums">
                      {Number(t.roundup || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right px-12 py-6">
                        <span className="inline-flex px-4 py-1.5 rounded-full bg-brand-coral/10 text-brand-coral font-extrabold tabular-nums">
                            +{Number(t.finalDonation || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-4 p-8 bg-brand-mint/10 rounded-[2.5rem] border-2 border-brand-mint/20">
        <Info className="h-6 w-6 text-brand-mint shrink-0" />
        <p className="text-sm font-medium text-brand-mint/80">
          Ces transactions sont récupérées en temps réel depuis votre compte bancaire via Bridge. 
          Les arrondis sont calculés à l'euro supérieur et multipliés selon vos préférences.
        </p>
      </div>
    </div>
  );
}
