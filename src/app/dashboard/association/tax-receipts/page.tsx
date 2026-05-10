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
import { Receipt, Download, FileText, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AssociationTaxReceiptsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  
  const isDemoMode = !!user?.isAnonymous;

  const taxReceiptsQuery = useMemo(() => {
    if (!firestore || !user || isDemoMode) return null;
    return query(
      collection(firestore, 'associations', user.uid, 'taxReceipts'),
      orderBy('year', 'desc')
    );
  }, [firestore, user, isDemoMode]);

  const { data: taxReceipts, isLoading } = useCollection(taxReceiptsQuery);

  const taxReceiptsList = useMemo(() => {
    if (isDemoMode) {
      return [
        { id: '1', donorName: 'Jean Dupont', year: 2025, totalAmount: 450.00, status: 'generated' },
        { id: '2', donorName: 'Marie Curie', year: 2025, totalAmount: 120.00, status: 'generated' },
        { id: '3', donorName: 'Pierre Martin', year: 2024, totalAmount: 300.00, status: 'generated' },
      ];
    }
    if (!taxReceipts) return [];
    return taxReceipts.map(r => ({
      id: r.id,
      donorName: r.donorName || "Donateur Anonyme",
      year: Number(r.year || new Date().getFullYear()),
      totalAmount: Number(r.totalAmount || 0),
      status: r.status || 'generated'
    }));
  }, [taxReceipts, isDemoMode]);

  const filteredReceipts = taxReceiptsList.filter(r => 
    r.donorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight text-foreground leading-[0.9]">
            Reçus<br />
            <span className="text-brand-coral font-serif italic font-bold">Fiscaux.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-headline font-light max-w-xl">
            Gérez et téléchargez les reçus fiscaux générés pour vos donateurs.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/[0.02] p-8 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-brand-coral/10 flex items-center justify-center text-brand-coral">
                  <FileText className="h-8 w-8" />
              </div>
              <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 block mb-1">REÇUS GÉNÉRÉS</span>
                  <div className="text-4xl font-headline font-extrabold text-foreground">{taxReceiptsList.length}</div>
              </div>
          </Card>
          <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/[0.02] p-8 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-brand-mint/10 flex items-center justify-center text-brand-mint">
                  <Receipt className="h-8 w-8" />
              </div>
              <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/50 block mb-1">MONTANT TOTAL ÉLIGIBLE</span>
                  <div className="text-4xl font-headline font-extrabold text-foreground">
                      {(taxReceiptsList.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
              </div>
          </Card>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-black/[0.02] bg-white overflow-hidden">
        <CardHeader className="p-12 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-3xl font-headline font-extrabold tracking-tight">Archives des reçus</CardTitle>
              <CardDescription className="text-lg font-headline font-light mt-2">Accédez aux documents fiscaux par donateur et par année.</CardDescription>
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
          ) : filteredReceipts.length === 0 ? (
            <div className="p-24 text-center">
                <div className="inline-flex p-4 bg-muted/20 rounded-full mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Aucun reçu fiscal généré</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {searchQuery ? "Aucun résultat pour cette recherche." : "Les reçus fiscaux sont générés automatiquement en début d'année civile."}
                </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-black/[0.02] border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Donateur</TableHead>
                  <TableHead className="px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Année</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Montant Cumulé</TableHead>
                  <TableHead className="text-right px-12 h-16 font-extrabold uppercase tracking-[0.2em] text-[10px] text-muted-foreground/50">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="group hover:bg-black/[0.01] border-black/[0.03] transition-all">
                    <TableCell className="px-12 py-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6" />
                        </div>
                        <span className="font-headline font-extrabold text-2xl tracking-tight">{receipt.donorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-12 py-8">
                        <span className="text-lg font-bold text-muted-foreground tabular-nums">{receipt.year}</span>
                    </TableCell>
                    <TableCell className="text-right px-12 py-8">
                        <span className="inline-flex px-6 py-2.5 rounded-full bg-brand-coral/10 text-brand-coral font-extrabold text-xl tabular-nums">
                            {receipt.totalAmount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || "0,00 €"}
                        </span>
                    </TableCell>
                    <TableCell className="text-right px-12 py-8">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-muted/20 hover:bg-brand-mint hover:text-white transition-all">
                            <Download className="h-5 w-5" />
                        </Button>
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
