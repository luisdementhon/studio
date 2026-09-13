"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ArrowDownRight, CheckCircle2, Clock, Info } from "lucide-react";
import { format, subDays, startOfDay, isAfter, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toDate } from "@/lib/utils";

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

/** Nombre de versements chargés : borne la requête ET le total affiché. */
const PAYOUTS_SHOWN = 50;

export default function AssociationPayoutsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  

  const payoutsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'associations', user.uid, 'payouts'),
      orderBy('date', 'desc'),
      limit(PAYOUTS_SHOWN)
    );
  }, [firestore, user]);

  const { data: payouts, isLoading } = useCollection(payoutsQuery);

  const payoutsList = useMemo(() => {
    if (!payouts) return [];
    return payouts.map(p => {
      const rawDate = (p as any).date;
      const dateObj = toDate(rawDate);
      return {
        id: p.id,
        amount: Number(p.amount || 0),
        date: dateObj,
        status: p.status || 'completed',
        reference: p.reference || 'N/A'
      };
    });
  }, [payouts]);

  return (
    <div className="flex flex-col gap-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            Vos<br />
            <span className="text-brand-mint font-serif italic font-bold">Versements.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-headline font-light max-w-xl">
            Consultez l'historique des fonds transférés vers votre compte bancaire.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/[0.02] p-8">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 block mb-4">DERNIER VERSEMENT</span>
              <div className="text-4xl font-headline font-extrabold text-foreground">
                  {payoutsList[0]?.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Le {payoutsList[0]?.date ? safeFormat(payoutsList[0].date, 'd MMMM yyyy', { locale: fr }) : "n/a"}</p>
          </Card>
          <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/[0.02] p-8">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 block mb-4">TOTAL REÇU</span>
              <div className="text-4xl font-headline font-extrabold text-brand-mint">
                  {(payoutsList.reduce((acc, p) => acc + Number(p.amount || 0), 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              {/* La requête est bornée à 50 versements : annoncer « depuis votre
                  inscription » sur un total tronqué serait faux. */}
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {payoutsList.length >= PAYOUTS_SHOWN
                  ? `Sur les ${PAYOUTS_SHOWN} derniers versements`
                  : 'Depuis votre inscription'}
              </p>
          </Card>
          <Card className="rounded-[2.5rem] border-none bg-brand-coral/5 border-2 border-brand-coral/10 p-8">
              <div className="flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4 text-brand-coral" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-coral">PROCHAIN VIREMENT</span>
              </div>
              <div className="text-4xl font-headline font-extrabold text-foreground">
                Prévu le 01/{(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2).toString().padStart(2, '0')}
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">Fréquence mensuelle automatique</p>
          </Card>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white overflow-hidden">
        <CardHeader className="p-12 pb-8">
            <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Historique des virements</CardTitle>
            <CardDescription className="text-lg font-headline font-light mt-2">Détail des fonds reversés par la plateforme.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : payoutsList.length === 0 ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-muted/20 rounded-full mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Aucun versement pour le moment</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Les versements sont effectués automatiquement chaque mois dès que le seuil minimum est atteint.
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/[0.02] border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Date & Référence</TableHead>
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Statut</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsList.map((payout) => (
                  <TableRow key={payout.id} className="group hover:bg-black/[0.01] border-black/[0.03] transition-all">
                    <TableCell className="px-12 py-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint group-hover:scale-110 transition-transform">
                          <ArrowDownRight className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-headline font-extrabold text-2xl tracking-tight">{safeFormat(payout.date, 'd MMMM yyyy', { locale: fr })}</span>
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Réf : {payout.reference}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-12 py-8">
                        <Badge className={`rounded-full px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest ${
                            payout.status === 'completed' ? 'bg-brand-mint/20 text-brand-mint hover:bg-brand-mint/30' : 'bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/30'
                        } border-none`}>
                            {payout.status === 'completed' ? (
                                <><CheckCircle2 className="mr-2 h-3 w-3" /> Transféré</>
                            ) : (
                                <><Clock className="mr-2 h-3 w-3" /> En cours</>
                            )}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right px-12 py-8">
                        <span className="inline-flex px-6 py-2.5 rounded-full bg-foreground text-white font-extrabold text-xl tabular-nums">
                            {payout.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "0,00 €"}
                        </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

