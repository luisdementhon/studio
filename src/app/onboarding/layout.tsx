import Link from "next/link";
import { DotlyLogo } from "@/components/dotly-logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
       <div className="absolute top-8 left-8">
        <Link href="/" aria-label="Retour à l'accueil">
          <DotlyLogo className="h-8 w-auto text-primary" />
        </Link>
      </div>
      <div className="w-full max-w-4xl mt-16">
        {children}
      </div>
    </div>
  );
}
