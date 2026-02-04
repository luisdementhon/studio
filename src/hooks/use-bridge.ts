"use client";

import { useState, useEffect } from 'react';
import { BRIDGE_CLIENT_ID } from '@/lib/bridge';

// This lets us check if window.Bridge is available
declare global {
  interface Window {
    Bridge: any;
  }
}

interface BridgeConfig {
  onSuccess: (itemId: string, metadata: any) => void;
  onError: (error: any) => void;
  onClose?: () => void;
}

export function useBridge({ onSuccess, onError, onClose }: BridgeConfig) {
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sdkError, setSdkError] = useState<Error | null>(null);

  useEffect(() => {
    // If already ready or if there's an error, do nothing.
    if (window.Bridge) {
      setIsSdkReady(true);
      return;
    }

    // Set a timeout to detect if the script fails to load.
    const loadTimeout = setTimeout(() => {
        if (!window.Bridge) {
            setSdkError(new Error("Le script de connexion bancaire n'a pas pu être chargé. Veuillez vérifier votre connexion ou votre bloqueur de publicités."));
            setIsSdkReady(false);
        }
    }, 10000); // 10 second timeout

    // Poll to see if the script has loaded
    const pollInterval = setInterval(() => {
      if (window.Bridge) {
        setIsSdkReady(true);
        clearInterval(pollInterval);
        clearTimeout(loadTimeout); // Clear the timeout if SDK is found
      }
    }, 100);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(loadTimeout);
    };
  }, []);

  const open = () => {
    if (!isSdkReady || !window.Bridge) {
      console.error("Bridge is not ready or available.");
      onError(new Error("Bridge SDK not loaded."));
      return;
    }
    
    if (!BRIDGE_CLIENT_ID) {
        console.error("Bridge Client ID is not configured. Please set NEXT_PUBLIC_BRIDGE_CLIENT_ID in your .env.local file.");
        onError(new Error("Bridge Client ID is not configured."));
        return;
    }

    setIsConnecting(true);
    
    window.Bridge.connect({
      client_id: BRIDGE_CLIENT_ID,
      env: 'production', // Use 'production' for real data
      countries: ['FR'], // Limit to French banks for now
      capabilities: ['transactions'],
      onSuccess: (itemId: string, metadata: any) => {
        setIsConnecting(false);
        onSuccess(itemId, metadata);
      },
      onError: (error: any) => {
        setIsConnecting(false);
        onError(error);
      },
      onClose: () => {
        setIsConnecting(false);
        if (onClose) {
          onClose();
        }
      },
      onEvent: (event: any) => {
        console.log("Bridge event:", event.type);
      },
    });
  };
  
  const isClientIdSet = !!BRIDGE_CLIENT_ID;
  const isReady = isSdkReady && isClientIdSet;

  return { open, isReady, isConnecting, isClientIdSet, isSdkReady, sdkError };
}
