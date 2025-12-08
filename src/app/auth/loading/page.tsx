
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoadingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    // Ne rien faire tant que Firebase n'a pas fini de déterminer l'état d'authentification.
    if (isUserLoading) {
      return;
    }

    // Une fois le chargement terminé, vérifier s'il y a un utilisateur.
    if (!user) {
      // Si aucun utilisateur, l'authentification a échoué ou l'utilisateur n'est pas connecté.
      // Retour à la page de connexion.
      router.replace('/login');
      return;
    }

    // Si un utilisateur est bien connecté, on vérifie son profil.
    const checkUserProfile = async () => {
      try {
        // 1. Vérifier si un profil "user" existe
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          router.replace('/dashboard/user');
          return;
        }

        // 2. Sinon, vérifier si un profil "association" existe
        const associationDocRef = doc(firestore, 'associations', user.uid);
        const associationDocSnap = await getDoc(associationDocRef);
        if (associationDocSnap.exists()) {
          router.replace('/dashboard/association');
          return;
        }

        // 3. Si aucun profil n'existe, c'est un nouvel utilisateur.
        router.replace('/onboarding');

      } catch (e) {
        // En cas d'erreur (problème de permissions, etc.), rediriger vers l'onboarding par sécurité.
        console.error("Erreur de redirection post-authentification :", e);
        router.replace('/onboarding');
      }
    };

    checkUserProfile();

  }, [user, isUserLoading, router, firestore]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Finalisation de la connexion...</h1>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
