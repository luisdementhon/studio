import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export const StripeProviderWrapper = ({ children, publishableKey }: { children: React.ReactNode, publishableKey: string }) => {
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as any}
    </StripeProvider>
  );
};
