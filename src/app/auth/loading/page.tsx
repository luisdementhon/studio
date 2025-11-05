
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
    // Wait until both user and profile data are done loading
    if (isUserLoading || (user && isProfileLoading)) {
      return;
    }

    if (!user) {
      // If no user is found after loading, go back to login
      router.replace('/login');
    } else {
      if (userData) {
        // User profile exists, go to dashboard
        router.replace('/dashboard/user');
      } else {
        // New user, go to onboarding
        router.replace('/onboarding');
      }
    }
  }, [user, isUserLoading, userData, isProfileLoading, router]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
