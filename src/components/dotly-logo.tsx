import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 441 91"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
    >
        <text
          fontFamily="serif"
          fontSize="100"
          fontWeight="normal"
          fill="currentColor"
          className={cn('font-headline')}
          x="0"
          y="75"
        >
          Dotly
        </text>
    </svg>
  );
}
