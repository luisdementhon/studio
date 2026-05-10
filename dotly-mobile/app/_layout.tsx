import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Colors } from '@/constants/Theme';
import { StripeProviderWrapper } from '@/components/StripeProviderWrapper';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inUserGroup = segments[0] === '(user)';
    const inAssociationGroup = segments[0] === '(association)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // User is logged in
    if (!role) {
      // No role set yet, must go through onboarding role selection
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)');
      }
    } else if (role === 'donor') {
      // Donor should be in (user) group
      if (!inUserGroup) {
        router.replace('/(user)');
      }
    } else if (role === 'association') {
      // Association should be in (association) group
      if (!inAssociationGroup) {
        router.replace('/(association)');
      }
    }
  }, [user, role, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(association)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Bricolage': BricolageGrotesque_400Regular,
    'Bricolage-Bold': BricolageGrotesque_700Bold,
    'Bricolage-ExtraBold': BricolageGrotesque_800ExtraBold,
    'Instrument': InstrumentSerif_400Regular,
    'Instrument-Italic': InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StripeProviderWrapper publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"}>
        <StatusBar style="dark" />
        <RootNavigator />
      </StripeProviderWrapper>
    </AuthProvider>
  );
}
