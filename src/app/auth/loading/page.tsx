
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getRedirectResult } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoadingPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const [triggered, setTriggered] = useState(false);

  // This effect handles the result from a Google Sign-In redirect.
  useEffect(() => {
    if (auth && !isUserLoading && !user) {
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            // The user is available in the result, the onAuthStateChanged listener
            // in the provider will also fire. The logic below will handle redirection.
            // We don't need to do anything here, the user state will update.
          }
          // If result is null, it means it's not a redirect sign-in,
          // or the result has already been processed.
        })
        .catch((error) => {
          console.error("Error processing redirect result:", error);
          router.replace('/login'); // Fallback to login on error
        });
    }
  }, [auth, isUserLoading, user, router]);


  // This effect will run when user or isUserLoading state changes.
  useEffect(() => {
    // Only trigger the check once Firebase has determined the auth state.
    if (!isUserLoading && !triggered) {
      setTriggered(true); // Mark as triggered to avoid re-running

      if (!user) {
        // If there's no user, auth failed. Go back to login.
        router.replace('/login');
        return;
      }

      // If there is a user, check for their profile.
      const checkUserProfile = async () => {
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
          // In case of an error, redirect to onboarding as a fallback.
          console.error("Error during post-auth redirection:", e);
          router.replace('/onboarding');
        }
      };

      checkUserProfile();
    }
  }, [user, isUserLoading, router, firestore, triggered]);

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
