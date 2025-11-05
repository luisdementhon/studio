import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 90"
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
        fill="#000000"
        fontFamily="'Playfair Display', serif"
        fontWeight="bold"
        fontSize="80"
      >
        Dotly
      </text>
    </svg>
  );
}
