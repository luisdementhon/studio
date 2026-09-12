"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Plus, Check, ExternalLink, Filter, Building2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DotlyBrand } from "@/components/ui/dotly-brand";
import { Separator } from "@/components/ui/separator";
import { collection, query, onSnapshot } from "firebase/firestore";

interface Association {
  id: string;
  associationName: string;
  description: string;
  logo: string;
  cause: string;
  website: string;
}

const causeLabels: Record<string, string> = {
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

export default function AssociationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userAssociations, setUserAssociations] = useState<string[]>([]);
  const [allAssociations, setAllAssociations] = useState<Association[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCause, setFilterCause] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const causes = Array.from(new Set(allAssociations.map(a => a.cause).filter(Boolean)));

  useEffect(() => {
    if (user && firestore) {
      // Fetch user's supported associations
      const userRef = doc(firestore, "users", user.uid);
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserAssociations(snap.data().associations || []);
        }
      });

      // Fetch all associations from collection
      const assocRef = collection(firestore, "associations");
      const unsubAssoc = onSnapshot(assocRef, (snap) => {
        const assocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Association));
        setAllAssociations(assocs);
        setLoading(false);
      });

      return () => {
        unsubUser();
        unsubAssoc();
      };
    }
  }, [user, firestore]);

  const toggleAssociation = async (assocId: string, isAdding: boolean) => {
    if (!user || !firestore) return;

    try {
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        associations: isAdding ? arrayUnion(assocId) : arrayRemove(assocId)
      });

      setUserAssociations(prev => 
        isAdding ? [...prev, assocId] : prev.filter(id => id !== assocId)
      );

      toast({
        title: isAdding ? "Association ajoutée !" : "Association retirée",
        description: isAdding ? "Elle fait maintenant partie de vos bénéficiaires." : "Elle a été retirée de votre liste.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos associations.",
        variant: "destructive"
      });
    }
  };

  const filteredAssociations = allAssociations.filter(assoc => {
    const name = assoc.associationName || "";
    const description = assoc.description || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterCause || assoc.cause === filterCause;
    return matchesSearch && matchesFilter;
  });

  const myAssocs = allAssociations.filter(a => userAssociations.includes(a.id));

  return (
    <div className="flex flex-col gap-12 max-w-6xl">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-headline font-extrabold tracking-tight text-foreground leading-[0.9]">
            Les<br />
            <span className="text-brand-coral font-serif italic font-bold">Assos.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-headline font-light max-w-2xl">
          Découvrez et choisissez les associations que vous souhaitez soutenir avec <DotlyBrand />
        </p>
      </div>

      {/* Mes Associations */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-brand-coral/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-brand-coral fill-brand-coral" />
            </div>
            <h2 className="text-3xl font-headline font-bold">Mes Associations ({myAssocs.length})</h2>
        </div>

        {myAssocs.length === 0 ? (
          <Card className="border-none bg-muted/20 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-muted">
            <CardContent className="space-y-4">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-lg">Vous ne soutenez aucune association pour le moment.</p>
              <p className="text-sm">Parcourez le catalogue ci-dessous pour commencer !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssocs.map(assoc => (
              <AssociationCard 
                key={assoc.id} 
                assoc={assoc} 
                isSupported={true} 
                onToggle={() => toggleAssociation(assoc.id, false)} 
              />
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-muted/50" />

      {/* Catalogue */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-brand-mint/10 flex items-center justify-center">
                    <Search className="h-5 w-5 text-brand-mint" />
                </div>
                <h2 className="text-3xl font-headline font-bold">Catalogue complet</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filterCause === null ? "vibrant" : "outline"}
                className="cursor-pointer px-4 py-1.5 rounded-full"
                onClick={() => setFilterCause(null)}
              >
                Toutes
              </Badge>
              {causes.map(cause => (
                <Badge 
                  key={cause}
                  variant={filterCause === cause ? "vibrant" : "outline"}
                  className="cursor-pointer px-4 py-1.5 rounded-full capitalize"
                  onClick={() => setFilterCause(cause)}
                >
                  {causeLabels[cause] || cause}
                </Badge>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une asso..." 
              className="pl-10 h-14 rounded-2xl bg-white border-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {allAssociations.length === 0 && !loading ? (
          <div className="p-12 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed">
            <p className="text-muted-foreground">Aucune association n'est encore disponible dans notre catalogue.</p>
            <p className="text-sm mt-2">Revenez très bientôt !</p>
          </div>
        ) : filteredAssociations.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Aucun résultat pour votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssociations.map(assoc => (
              <AssociationCard 
                key={assoc.id} 
                assoc={assoc} 
                isSupported={userAssociations.includes(assoc.id)} 
                onToggle={() => toggleAssociation(assoc.id, !userAssociations.includes(assoc.id))} 
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AssociationCard({ assoc, isSupported, onToggle }: { assoc: Association, isSupported: boolean, onToggle: () => void }) {
  return (
    <Card className="group h-full rounded-[2.5rem] border-none bg-white shadow-2xl shadow-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-black/[0.06] overflow-hidden flex flex-col">
      <CardHeader className="p-8 pb-4">
        <div className="flex justify-between items-start mb-6">
          <div className="h-16 w-16 rounded-2xl bg-muted/10 flex items-center justify-center text-4xl shadow-inner">
            {assoc.logo || '🏢'}
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 bg-white capitalize">
            {causeLabels[assoc.cause] || assoc.cause || "Autre"}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-headline font-extrabold tracking-tight group-hover:text-brand-coral transition-colors">
          {assoc.associationName || "Sans nom"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 flex-1">
        <p className="text-muted-foreground font-headline font-light leading-relaxed">
          {assoc.description || "Aucune description disponible."}
        </p>
      </CardContent>
      <div className="p-8 pt-0 mt-auto flex gap-3">
        <Button 
          variant={isSupported ? "outline" : "vibrant"}
          className={`flex-1 h-12 rounded-xl font-bold transition-all ${isSupported ? 'border-brand-mint text-brand-mint hover:bg-brand-mint/5' : ''}`}
          onClick={onToggle}
        >
          {isSupported ? (
            <><Check className="mr-2 h-4 w-4" /> Soutenue</>
          ) : (
            <><Plus className="mr-2 h-4 w-4" /> Soutenir</>
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl" asChild>
          <a href={assoc.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
