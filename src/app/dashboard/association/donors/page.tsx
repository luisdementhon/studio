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
import { Users, Search, Filter, Loader2, User } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AssociationDonorsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  
  const isDemoMode = !!user?.isAnonymous;

  const donationsQuery = useMemo(() => {
    if (!firestore || !user || isDemoMode) return null;
    return query(
      collection(firestore, 'associations', user.uid, 'donations'),
      orderBy('transactionDate', 'desc'),
      limit(100)
    );
  }, [firestore, user, isDemoMode]);

  const { data: donations, isLoading } = useCollection(donationsQuery);

  const donorsList = useMemo(() => {
    if (isDemoMode) {
      return [
        { id: '1', name: 'Jean Dupont', amount: 25.50, date: new Date() },
        { id: '2', name: 'Marie Curie', amount: 42.00, date: subDays(new Date(), 1) },
        { id: '3', name: 'Pierre Martin', amount: 15.20, date: subDays(new Date(), 3) },
        { id: '4', name: 'Sophie Lemoine', amount: 120.00, date: subDays(new Date(), 5) },
      ];
    }
    if (!donations) return [];
    return donations.map(d => {
      const rawDate = (d as any).transactionDate;
      const dateObj = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : (rawDate instanceof Date ? rawDate : new Date());
      return {
        id: d.id,
        name: "Donateur Anonyme",
        amount: Number(d.amount || 0),
        date: dateObj
      };
    });
  }, [donations, isDemoMode]);

  const filteredDonors = donorsList.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDonors = donorsList.length;
  const totalAmount = donorsList.reduce((acc, d) => acc + Number(d.amount || 0), 0);

  return (
    <div className="flex flex-col gap-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            Vos<br />
            <span className="text-brand-coral font-serif italic font-bold">Donateurs.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-headline font-light max-w-xl">
            Retrouvez la liste des personnes qui soutiennent vos projets via la plateforme.
          </p>
        </div>

        <div className="flex gap-4">
            <Card className="rounded-3xl border-none bg-white shadow-xl shadow-black/[0.02] px-8 py-4 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 mb-1">TOTAL DONATEURS</span>
                <span className="text-3xl font-headline font-extrabold text-brand-coral">{totalDonors}</span>
            </Card>
            <Card className="rounded-3xl border-none bg-white shadow-xl shadow-black/[0.02] px-8 py-4 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 mb-1">MONTANT TOTAL</span>
                <span className="text-3xl font-headline font-extrabold text-brand-mint">{(totalAmount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </Card>
        </div>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white overflow-hidden">
        <CardHeader className="p-12 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Liste des contributions</CardTitle>
              <CardDescription className="text-lg font-headline font-light mt-2">Détail de chaque don reçu en temps réel.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un donateur..." 
                className="pl-10 h-14 rounded-2xl bg-muted/20 border-none text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-muted/20 rounded-full mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Aucun donateur trouvé</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {searchQuery ? "Aucun résultat pour cette recherche." : "Vous n'avez pas encore reçu de dons via la plateforme."}
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/[0.02] border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Donateur</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Montant</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.map((donor) => (
                  <TableRow key={donor.id} className="group hover:bg-black/[0.01] border-black/[0.03] transition-all">
                    <TableCell className="px-12 py-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-brand-coral/10 flex items-center justify-center font-headline font-extrabold text-brand-coral group-hover:scale-110 transition-transform">
                          <User className="h-6 w-6" />
                        </div>
                        <span className="font-headline font-extrabold text-2xl tracking-tight">{donor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-12 py-8">
                        <span className="inline-flex px-6 py-2.5 rounded-full bg-brand-mint/10 text-brand-mint font-extrabold text-xl tabular-nums">
                            {donor.amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "0,00 €"}
                        </span>
                    </TableCell>
                    <TableCell className="text-right px-12 py-8 text-muted-foreground font-bold text-base">
                        {donor.date ? format(donor.date, 'd MMM yyyy', { locale: fr }) : "n/a"}
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

