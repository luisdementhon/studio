'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandPattern } from '@/components/brand-pattern';

export default function BridgeCallbackPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <BrandPattern />
      
      <Card className="w-full max-w-md z-10 border-2 border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Banque connectée avec succès !</CardTitle>
          <CardDescription className="text-lg mt-2">
            Félicitations ! Votre compte est désormais lié à Dotly.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center text-muted-foreground">
          <p>
            Chaque transaction que vous effectuerez sera désormais arrondie à l'euro supérieur. 
            La différence sera automatiquement reversée aux associations que vous soutenez. 
            Merci de contribuer à un monde meilleur, un centime à la fois !
          </p>
        </CardContent>
        
        <CardFooter>
          <Button 
            asChild 
            className="w-full text-lg h-12 from-amber-400 to-yellow-300 text-slate-900 hover:brightness-110 font-bold" 
            variant="vibrant"
          >
            <Link href="/">
              Aller au dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
