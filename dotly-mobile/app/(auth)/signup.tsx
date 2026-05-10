import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSizes } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide.';
    if (!password) newErrors.password = 'Le mot de passe est requis.';
    else if (password.length < 8)
      newErrors.password = 'Au moins 8 caractères.';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Navigation handled by root layout
    } catch (error: any) {
      let message = 'Une erreur est survenue.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Cet email est déjà utilisé.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Le mot de passe est trop faible.';
      }
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <DotlyBrand size={56} />
            <Text style={styles.subtitle}>
              Petite monnaie,{'\n'}
              <Text style={styles.subtitleAccent}>grands gestes.</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Créer un compte</Text>

            <Input
              label="Email"
              placeholder="votre@email.com"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />

            <Input
              label="Mot de passe"
              placeholder="Au moins 8 caractères"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirmer"
              placeholder="Retapez votre mot de passe"
              icon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title="Créer mon compte"
              onPress={handleSignup}
              loading={loading}
              variant="secondary"
            />

            <Button
              title="J'ai déjà un compte"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Bricolage',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  subtitleAccent: {
    fontFamily: 'Instrument-Italic',
    fontSize: 32,
    color: Colors.mint,
  },
  form: {
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.xxl,
    color: Colors.foreground,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
});
