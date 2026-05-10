
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { CustomCursor } from '@/components/ui/custom-cursor';
import './globals.css';
import Script from 'next/script';


export const metadata: Metadata = {
  title: 'dotly. Change for Change',
  description: 'Transformez votre petite monnaie en grands gestes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Instrument+Serif:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background selection:bg-brand-coral/30">
        <FirebaseClientProvider>
          <CustomCursor />
          {children}
        </FirebaseClientProvider>
        <Toaster />
        <Script src="https://connect.bridgeapi.io/bridge.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
