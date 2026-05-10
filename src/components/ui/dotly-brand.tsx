import React from 'react';
import { cn } from '@/lib/utils';

interface DotlyBrandProps {
  className?: string;
  withDot?: boolean;
}

export function DotlyBrand({ className, withDot = true }: DotlyBrandProps) {
  return (
    <span className={cn("font-headline font-semibold tracking-tight text-black", className)}>
      dotly
      {withDot && <span className="text-brand-coral">.</span>}
    </span>
  );
}

// Note: Ensure that when using donations, you apply the following safety check:
// donations.forEach(donation => {
//   const amount = Number(donation.amount || 0);
//   const rawDate = (donation as any).transactionDate;
//   const donationDate = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : (rawDate instanceof Date ? rawDate : new Date());
//   totalFunds += amount;
// });
