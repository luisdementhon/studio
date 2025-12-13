
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoadingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    // Wait until Firebase has finished its initial auth state check.
    if (isUserLoading) {
      return;
    }

    // If there is no user after loading, redirect to login.
    // This happens on direct navigation or if auth fails.
    if (!user) {
      router.replace('/login');
      return;
    }

    // If there IS a user, we can proceed with profile checks.
    const checkUserProfile = async () => {
      // Ensure firestore is available before proceeding.
      if (!firestore) {
          // This case is unlikely if the provider is set up correctly, but it's a safe guard.
          console.error("Firestore not available, cannot check profile.");
          router.replace('/login'); // Fallback
          return;
      }
      
      try {
        // 1. Check if a "user" profile exists
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          router.replace('/dashboard/user');
          return;
        }

        // 2. Otherwise, check if an "association" profile exists
        const associationDocRef = doc(firestore, 'associations', user.uid);
        const associationDocSnap = await getDoc(associationDocRef);
        if (associationDocSnap.exists()) {
          router.replace('/dashboard/association');
          return;
        }

        // 3. If no profile exists, it's a new user.
        router.replace('/onboarding');

      } catch (e) {
        // In case of an error (e.g., Firestore rules), redirect to onboarding as a fallback.
        console.error("Error during post-auth redirection:", e);
        router.replace('/onboarding');
      }
    };

    checkUserProfile();
    
    // The dependencies ensure this effect runs only once after auth state is resolved.
  }, [user, isUserLoading, router, firestore]);

  // Display a loading skeleton while we wait.
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
