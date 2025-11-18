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
          "bg-gradient-to-br from-transparent via-primary/5 to-primary/10",
          "[mask-image:radial-gradient(100%_120%_at_top,white,transparent)]"
        )}
      >
      </div>
    </div>
  );
}
