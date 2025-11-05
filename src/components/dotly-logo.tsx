import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 130 36"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
    >
      <text
        x="0"
        y="28"
        fontSize="32"
        fontWeight="800"
        fill="currentColor"
        className={cn('font-headline')}
      >
        dotly
      </text>
    </svg>
  );
}
