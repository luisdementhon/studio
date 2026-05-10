import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Button } from '@/components/Button';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { fetchApi } from '@/lib/api';

interface Step3PaymentProps {
  onFinish: () => void;
  onBack: () => void;
}

export function Step3Payment({ onFinish, onBack }: Step3PaymentProps) {
  const { user } = useAuth();
  const { confirmSetupIntent } = useStripe();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [cardInfo, setCardInfo] = useState<{ brand?: string, last4?: string } | null>(null);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.paymentMethodLinked) {
            setIsSaved(true);
            setCardInfo({ brand: data.cardBrand, last4: data.cardLast4 });
          }
        }
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !isCardComplete) return;
    setIsProcessing(true);

    try {
      // 1. Fetch Client Secret
      const res = await fetchApi('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // 2. Confirm Setup Intent
      const { error, setupIntent } = await confirmSetupIntent(data.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { email: user.email || undefined },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.status === 'Succeeded') {
        // 3. Update Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          paymentMethodLinked: true,
          stripeSetupIntentId: setupIntent.id,
          cardBrand: "Visa", // Simulated until API gives us details
          cardLast4: "4242",
          updatedAt: new Date().toISOString(),
        });

        setIsSaved(true);
        setCardInfo({ brand: "Visa", last4: "4242" });
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d\'enregistrer la carte.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSaved) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color="#FFF" />
          </View>
          <View>
            <Text style={styles.successTitle}>Moyen de paiement actif</Text>
            <Text style={styles.successSubtitle}>
              {cardInfo?.brand} se terminant par •••• {cardInfo?.last4 || "****"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Accéder à mon tableau de bord" 
            onPress={onFinish} 
            variant="vibrant"
            style={styles.fullButton}
          />
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="card" size={32} color={Colors.coral} />
            </View>
            <View>
              <Text style={styles.title}>Informations de paiement</Text>
              <Text style={styles.subtitle}>Sécurisé par Stripe (AES-256)</Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            <CardField
              postalCodeEnabled={false}
              cardStyle={styles.cardField}
              style={styles.cardFieldWrapper}
              onCardChange={(cardDetails) => {
                setIsCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={12} color={Colors.muted} />
            <Text style={styles.securityText}>
              dotly ne stocke jamais vos coordonnées bancaires. Tout est crypté chez Stripe.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Enregistrer ma carte" 
            onPress={handleSubmit} 
            variant="vibrant"
            loading={isProcessing}
            disabled={!isCardComplete}
            style={styles.fullButton}
          />
          <Button 
            title="Étape précédente" 
            onPress={onBack} 
            variant="ghost" 
            icon={<Ionicons name="chevron-back" size={20} color={Colors.foreground} style={{ marginRight: 8 }} />}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl * 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  cardFieldWrapper: {
    width: '100%',
    height: 50,
  },
  cardField: {
    borderWidth: 0,
    backgroundColor: '#FFF',
    textColor: '#1a1a1a',
    fontSize: 16,
    placeholderColor: '#aab7c4',
  } as any,
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  securityText: {
    fontSize: FontSizes.xs,
    color: Colors.muted,
    flex: 1,
  },
  footer: {
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  fullButton: {
    width: '100%',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(92, 198, 172, 0.1)',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl * 2,
    borderWidth: 2,
    borderColor: 'rgba(92, 198, 172, 0.2)',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.foreground,
  },
  successSubtitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.muted,
    marginTop: 4,
  },
});
