import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="140" height="48" viewBox="0 0 280 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="hover:opacity-80 transition-opacity" {...props}>
      {/* D */}
      <path d="M0 76L8 8H32C48 8 60 12 68 20C76 28 80 40 80 56C80 72 76 84 68 92C60 100 48 104 32 104H8L0 76ZM28 88H32C40 88 46 85 50 79C54 73 56 65 56 55C56 45 54 37 50 31C46 25 40 22 32 22H28L24 88Z" fill="#000000"/>
      
      {/* o with cut */}
      <path d="M100 42C108 42 114 44 118 48C122 52 124 58 124 66C124 74 122 80 118 84C114 88 108 90 100 90C92 90 86 88 82 84C78 80 76 74 76 66C76 58 78 52 82 48C86 44 92 42 100 42ZM100 56C96 56 93 57 91 59C89 61 88 64 88 68C88 72 89 75 91 77C93 79 96 80 100 80C104 80 107 79 109 77C111 75 112 72 112 68C112 64 111 61 109 59L104 56H100Z" fill="#000000"/>
      
      {/* Yellow dot */}
      <circle cx="118" cy="50" r="8" fill="#FCD34D"/>
      
      {/* t */}
      <path d="M130 40H146L142 68C141 74 142 77 146 77C148 77 150 76 152 74L148 86C144 88 140 89 136 89C128 89 125 85 126 77L130 52H122L124 40ZM134 24H148L146 34H132L134 24Z" fill="#000000"/>
      
      {/* l */}
      <path d="M160 10H174L166 76H152L160 10Z" fill="#000000"/>
      
      {/* y */}
      <path d="M180 42H194L188 76L176 110H162L170 82L168 76L180 42Z" fill="#000000"/>
    </svg>
  );
}
