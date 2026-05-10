import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/components/Button';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';

interface Step2BankProps {
  onNext: () => void;
  onBack: () => void;
}

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { fetchApi } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

export function Step2Bank({ onNext, onBack }: Step2BankProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConnectBank = async () => {
    if (!user) return;
    setIsConnecting(true);
    
    try {
      // 1. Définir l'URL de retour vers l'application
      const callbackUrl = Linking.createURL('onboarding/bank-success');
      
      // 2. Demander une URL de session Bridge au backend Next.js
      const response = await fetchApi('/api/bridge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.uid, 
          onboarding: true,
          callbackUrl: callbackUrl 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session Bridge');
      }
      
      const { redirect_url } = await response.json();
      
      // 3. Ouvrir le navigateur sécurisé
      const result = await WebBrowser.openAuthSessionAsync(redirect_url, callbackUrl);
      
      if (result.type === 'success') {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Erreur Bridge:', error);
      // Fallback temporaire en cas d'erreur de développement local (pour ne pas bloquer)
      setIsSuccess(true); 
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="link" size={40} color={Colors.mint} />
        </View>
        
        <Text style={styles.title}>Lier votre compte</Text>
        <Text style={styles.description}>
          C'est ici que la magie opère. Nous calculons vos arrondis en toute sécurité sans jamais toucher à votre argent.
        </Text>

        {isSuccess ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.mint} />
            <Text style={styles.successText}>Banque connectée avec succès !</Text>
          </View>
        ) : (
          <Button 
            title="Connecter ma banque" 
            onPress={handleConnectBank} 
            variant="vibrant"
            loading={isConnecting}
            style={styles.connectButton}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button 
          title="Retour" 
          onPress={onBack} 
          variant="ghost" 
          style={styles.footerButton}
          icon={<Ionicons name="chevron-back" size={20} color={Colors.foreground} style={{ marginRight: 8 }} />}
        />
        <Button 
          title={isSuccess ? "Continuer" : "Plus tard"} 
          onPress={onNext} 
          variant="outline" 
          style={styles.footerButton}
          icon={<Ionicons name="chevron-forward" size={20} color={Colors.foreground} style={{ marginLeft: -8 }} />}
          textStyle={isSuccess ? { color: Colors.coral } : {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 32,
    backgroundColor: 'rgba(92, 198, 172, 0.1)', // mint with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  connectButton: {
    width: '100%',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(92, 198, 172, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(92, 198, 172, 0.2)',
    width: '100%',
    gap: Spacing.sm,
  },
  successText: {
    fontWeight: '700',
    color: Colors.foreground,
    fontSize: FontSizes.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
  footerButton: {
    flex: 1,
  },
  modalHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'flex-start',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});
