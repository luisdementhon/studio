
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoadingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (isUserLoading || (user && isProfileLoading)) {
      return; // Attendre la fin du chargement de l'utilisateur et du profil
    }

    if (!user) {
      // Si aucun utilisateur, retour à la page de connexion
      router.replace('/login');
      return;
    }

    const checkUserProfile = async () => {
      // Si le profil utilisateur existe dans useDoc, rediriger vers le tableau de bord utilisateur
      if (userData) {
        router.replace('/dashboard/user');
        return;
      }

      // Si le profil utilisateur n'existe pas, vérifier s'il existe un profil d'association
      try {
        const associationDocRef = doc(firestore, 'associations', user.uid);
        const associationDocSnap = await getDoc(associationDocRef);

        if (associationDocSnap.exists()) {
          // Si un profil d'association existe, rediriger vers le tableau de bord de l'association
          router.replace('/dashboard/association');
        } else {
          // Sinon, nouvel utilisateur, rediriger vers l'onboarding
          router.replace('/onboarding');
        }
      } catch (e) {
        // En cas d'erreur (ex: problème de permissions), rediriger vers l'onboarding par sécurité
        console.error("Redirection error:", e);
        router.replace('/onboarding');
      }
    };

    checkUserProfile();

  }, [user, isUserLoading, userData, isProfileLoading, router, firestore]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Chargement de votre session...</h1>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
