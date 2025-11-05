import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function DotlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 160 90"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dotly Logo"
      {...props}
      className={cn(props.className)}
    >
      <rect width="160" height="90" fill="white" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#000000"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontWeight="bold"
        fontSize="18"
      >
        Dotly
      </text>
    </svg>
  );
}
