"use client";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function ConnectBridgeAccount() {
  
  return (
    <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-base">Intégration en cours</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                La connexion aux comptes bancaires via Bridge est en cours de développement. Cette fonctionnalité sera bientôt disponible.
            </p>
        </CardContent>
    </Card>
  );
}
