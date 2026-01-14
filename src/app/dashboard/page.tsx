'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function DashboardRoot() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (isUserLoading || (user && isProfileLoading)) {
      return;
    }

    if (user) {
      if (userData) {
        router.replace('/dashboard/user');
      } else {
        // If user exists but has no profile data, they might be an association
        // or need to go through onboarding.
        // For simplicity, we'll try checking for an association profile.
        // A more robust solution might use custom claims or a 'role' field.
        const associationDocRef = doc(firestore, 'associations', user.uid);
        // This is a simplified check. We're not using useDoc here to avoid complexity
        // in this redirect logic. A full check would be better.
        // For now, if user profile is missing, we send to user dashboard,
        // they can switch via sidebar. A better check for association could be done here.
        router.replace('/dashboard/user');
      }
    } else {
      router.replace('/login');
    }
  }, [user, userData, isUserLoading, isProfileLoading, router, firestore]);

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
