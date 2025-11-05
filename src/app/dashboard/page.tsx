'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';

export default function DashboardRoot() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // In a real app, you would check a 'role' property on the user document
        // For now, we assume if they are logged in, they are a 'user'.
        // We'll redirect to the user dashboard. If they need to go to association, they can use the sidebar.
        router.replace('/dashboard/user');
      } else {
        // If no user, redirect to login
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router]);

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
