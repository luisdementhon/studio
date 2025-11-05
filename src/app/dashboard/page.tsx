'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check the user's role from a session
    // and redirect to the appropriate dashboard.
    // For this demo, we'll redirect to the user selection as a fallback,
    // as if the user hasn't completed onboarding yet.
    router.replace('/onboarding');
  }, [router]);

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
