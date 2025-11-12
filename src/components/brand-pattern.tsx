import { cn } from "@/lib/utils";

export function BrandPattern() {
  return (
    <div
      className="absolute inset-0 -z-10 h-full w-full bg-background"
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 top-0",
          "[mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        )}
      >
        <svg
          className="absolute -left-32 -top-40 h-[1000px] w-[1000px] fill-current opacity-20 text-primary/10"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="pattern-circles"
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
              width={40}
              height={40}
            >
              <circle cx={20} cy={20} r={1} className="fill-current" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#pattern-circles)"
          />
        </svg>
      </div>
    </div>
  );
}
