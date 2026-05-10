import Link from "next/link";
import { DotlyBrand } from "@/components/ui/dotly-brand";
import { BrandPattern } from "@/components/brand-pattern";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
      <BrandPattern />
       <div className="absolute top-8 left-8">
        <Link href="/" aria-label="Retour à l'accueil" className="group">
          <DotlyBrand className="text-4xl transition-transform group-hover:scale-105" />
        </Link>
      </div>
      <div className="w-full max-w-4xl mt-16 z-10">
        {children}
      </div>
    </div>
  );
}
