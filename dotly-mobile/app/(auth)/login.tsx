import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithCredential 
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSizes } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'L\'email est requis.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide.';
    if (!password) newErrors.password = 'Le mot de passe est requis.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasGoogleConfig = !!(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

  const [request, response, promptAsync] = Google.useAuthRequest(
    hasGoogleConfig ? {
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    } : {
      iosClientId: 'dummy',
    }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      Alert.alert(
        "Erreur Google Auth", 
        `Détails : ${response.error?.message || 'Erreur inconnue'}\n\nCode : ${response.error?.code || 'N/A'}`
      );
    }
  }, [response]);

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      let message = 'Une erreur est survenue.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Email ou mot de passe incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Trop de tentatives. Réessayez plus tard.';
      }
      Alert.alert('Erreur de connexion', message);
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
          {/* Header */}
          <View style={styles.header}>
            <DotlyBrand size={56} />
            <Text style={styles.tagline}>
              Petite monnaie,{'\n'}
              <Text style={styles.taglineAccent}>grands gestes.</Text>
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Connexion</Text>

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
              placeholder="••••••••"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continuer avec Google"
              onPress={() => {
                if (hasGoogleConfig) {
                  promptAsync();
                } else {
                  Alert.alert("Configuration requise", "L'authentification Google n'est pas encore configurée sur ce terminal.");
                }
              }}
              variant="outline"
              icon={<Ionicons name="logo-google" size={20} color={Colors.foreground} />}
            />

            <Button
              title="Créer un compte"
              onPress={() => router.push('/(auth)/signup')}
              variant="ghost"
            />
          </View>

          {/* Footer */}
          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
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
  tagline: {
    fontFamily: 'Bricolage',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  taglineAccent: {
    fontFamily: 'Instrument-Italic',
    fontSize: 32,
    color: Colors.coral,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
    fontWeight: '600',
  },
  forgot: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  forgotText: {
    fontSize: FontSizes.base,
    color: Colors.muted,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
