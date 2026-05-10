import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { Step1Profile } from '@/components/onboarding/Step1Profile';
import { Step2Bank } from '@/components/onboarding/Step2Bank';
import { Step3Payment } from '@/components/onboarding/Step3Payment';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function UserOnboarding() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const handleFinish = async () => {
    if (user) {
      // Mark as donor in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        role: 'donor',
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await refreshProfile();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  step >= s ? styles.progressDotActive : styles.progressDotInactive
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.titleContainer}>
          {step === 1 && (
            <>
              <Text style={styles.title}>Votre profil</Text>
              <Text style={styles.subtitle}>Dites-nous quelles causes vous tiennent à cœur.</Text>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.title}>L'arrondi</Text>
              <Text style={styles.subtitle}>Connectez votre banque pour activer les arrondis.</Text>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.title}>Paiement</Text>
              <Text style={styles.subtitle}>Enregistrez votre carte pour valider vos dons.</Text>
            </>
          )}
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 && <Step1Profile onNext={() => setStep(2)} />}
          {step === 2 && <Step2Bank onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3Payment onFinish={handleFinish} onBack={() => setStep(2)} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginRight: 40, // Balance back button
  },
  progressDot: {
    height: 6,
    width: 40,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: Colors.coral,
  },
  progressDotInactive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  titleContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 32,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
  },
  content: {
    flex: 1,
  },
});
