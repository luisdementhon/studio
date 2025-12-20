import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  const uniqueId = "dotly-logo-gradient";
  return (
    <svg
      viewBox="0 0 400 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
      className={cn(props.className)}
    >
      <defs>
        <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--accent-vibrant))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={`url(#${uniqueId})`}
        fontFamily="'Playfair Display', serif"
        fontWeight="bold"
        fontSize="120"
      >
        Dotly
      </text>
    </svg>
  );
}
