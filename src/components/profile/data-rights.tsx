'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { authedFetch } from '@/lib/api-client';

/**
 * Export et suppression des données personnelles (RGPD).
 */
export function DataRightsSection() {
  const { toast } = useToast();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await authedFetch('/api/account/export');
      if (!response.ok) throw new Error("L'export a échoué.");

      // Téléchargement déclenché depuis le blob : l'URL de la route est
      // authentifiée, un lien direct ne porterait pas le jeton.
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dotly-mes-donnees.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await authedFetch('/api/account/delete', { method: 'POST' });
      if (!response.ok) throw new Error('La suppression a échoué.');

      toast({ title: 'Compte supprimé', description: 'Vos données ont été effacées.' });
      router.push('/');
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-muted/20 p-6">
        <div>
          <h4 className="font-bold">Exporter mes données</h4>
          <p className="text-sm text-muted-foreground">
            Téléchargez l'ensemble des données que dotly détient sur vous.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="rounded-xl shrink-0">
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exporter
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6">
        <div>
          <h4 className="font-bold text-destructive">Supprimer mon compte</h4>
          <p className="text-sm text-muted-foreground">
            Efface votre profil, révoque l'accès à votre banque et supprime votre moyen de paiement.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting} className="rounded-xl shrink-0">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Votre profil, vos préférences et votre historique
                seront effacés, et l'accès à votre compte bancaire sera révoqué. Les dons déjà
                versés restent conservés de façon anonyme par les associations, au titre de leurs
                obligations comptables.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
