import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
      className={cn(props.className)}
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Playfair Display', serif"
        fontWeight="bold"
        fontSize="240"
      >
        Dotly
      </text>
    </svg>
  );
}
