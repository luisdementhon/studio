import Link from "next/link";
import { DotlyLogo } from "@/components/dotly-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link href="/" aria-label="Retour à l'accueil">
          <DotlyLogo className="h-8 w-auto text-primary" />
        </Link>
      </div>
      {children}
    </div>
  );
}
