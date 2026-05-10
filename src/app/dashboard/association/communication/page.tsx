import { Hammer } from 'lucide-react';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-24 w-24 rounded-full bg-brand-coral/10 flex items-center justify-center mb-8">
        <Hammer className="h-10 w-10 text-brand-coral" />
      </div>
      <h1 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-foreground mb-4 leading-tight">
        Page en <br className="md:hidden" /><span className="text-brand-coral font-serif italic font-bold">construction.</span>
      </h1>
      <p className="text-xl text-muted-foreground font-headline font-medium max-w-md mt-6">
        Cette fonctionnalité sera bientôt disponible. Merci de votre patience.
      </p>
    </div>
  );
}
