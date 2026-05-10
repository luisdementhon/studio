import React from 'react';

export const StripeProviderWrapper = ({ children }: { children: React.ReactNode, publishableKey: string }) => {
  return <>{children}</>;
};
