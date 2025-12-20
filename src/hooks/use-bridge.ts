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
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // The Bridge SDK is loaded globally via a <script> tag in layout.tsx.
    // We just need to check when it's available.
    if (window.Bridge) {
      setIsReady(true);
    } else {
      // Poll to see if the script has loaded
      const interval = setInterval(() => {
        if (window.Bridge) {
          setIsReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const open = () => {
    if (!isReady || !window.Bridge) {
      console.error("Bridge is not ready or available.");
      onError(new Error("Bridge SDK not loaded."));
      return;
    }

    setIsConnecting(true);
    
    window.Bridge.connect({
      client_id: BRIDGE_CLIENT_ID,
      env: 'sandbox', // Use 'production' for real data
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

  return { open, isReady, isConnecting };
}
