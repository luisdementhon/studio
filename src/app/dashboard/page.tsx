'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardRoot() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const checkRedirect = async () => {
      if (!firestore) return;
      try {
        // 1. Check if user profile exists
        const userDocRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        // Même piège qu'en /auth/loading : le document existe dès
        // l'inscription (email de bienvenue), bien avant l'onboarding.
        // On teste donc la complétude du profil, pas son existence.
        if (userSnap.exists() && userSnap.data()?.firstName) {
          router.replace('/dashboard/user');
          return;
        }

        // 2. Check if association profile exists
        const associationDocRef = doc(firestore, 'associations', user.uid);
        const associationSnap = await getDoc(associationDocRef);
        if (associationSnap.exists()) {
          router.replace('/dashboard/association');
          return;
        }

        // 3. Fallback to onboarding if neither profile exists
        router.replace('/onboarding');
      } catch (e) {
        console.error("Dashboard routing error:", e);
        router.replace('/onboarding');
      }
    };

    checkRedirect();
  }, [user, isUserLoading, router, firestore]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-24 w-1/2" />
          <Skeleton className="h-24 w-1/2" />
        </div>
      </div>
    </div>
  );
}
