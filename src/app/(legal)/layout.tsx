import Link from 'next/link';
import { DotlyBrand } from '@/components/ui/dotly-brand';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 px-8 flex items-center border-b border-black/[0.05]">
        <Link href="/">
          <DotlyBrand className="text-3xl" />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-20">
        <article className="prose-dotly space-y-6">{children}</article>
      </main>

      <footer className="px-8 py-12 border-t border-black/[0.05] text-center">
        <div className="flex items-center justify-center gap-6 text-xs font-bold text-foreground/40">
          <Link href="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link href="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
        </div>
      </footer>
    </div>
  );
}
