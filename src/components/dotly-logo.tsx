import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 452 91"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
    >
      <text
        x="0"
        y="67"
        fontFamily="serif"
        fontSize="100"
        fontWeight="bold"
        fill="currentColor"
        className={cn('font-headline')}
      >
        Dotly
      </text>
      <text x="350" y="85" fontSize="70">
        💰
      </text>
    </svg>
  );
}
