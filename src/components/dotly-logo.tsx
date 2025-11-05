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
      <g fill="none" fillRule="evenodd">
        <text
          fontFamily="serif"
          fontSize="100"
          fontWeight="bold"
          fill="currentColor"
          className={cn('font-headline')}
          x="91"
          y="67"
        >
          Dotly
        </text>
        <g transform="translate(0 1)" stroke="currentColor" strokeWidth="4">
          <circle cx="44" cy="44" r="42" />
          <path
            d="M44 88c24.3 0 44-19.7 44-44S68.3 0 44 0 0 19.7 0 44"
            opacity=".2"
          />
          <path
            d="M44 88c-24.3 0-44-19.7-44-44S19.7 0 44 0"
            opacity=".2"
          />
        </g>
      </g>
    </svg>
  );
}
