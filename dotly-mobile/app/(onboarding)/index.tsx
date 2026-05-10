import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenue sur</Text>
          <DotlyBrand size={60} color={Colors.coral} />
          <Text style={styles.subtitle}>
            Pour commencer, dites-nous qui vous êtes.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(onboarding)/user')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.coral + '10' }]}>
              <Ionicons name="person" size={32} color={Colors.coral} />
            </View>
            <Text style={styles.cardTitle}>Je suis un particulier</Text>
            <Text style={styles.cardDescription}>Commencer à donner</Text>
            <Ionicons name="arrow-forward" size={24} color={Colors.muted} style={styles.arrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push('/(onboarding)/association')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.mint + '10' }]}>
              <Ionicons name="business" size={32} color={Colors.mint} />
            </View>
            <Text style={styles.cardTitle}>Nous sommes une association</Text>
            <Text style={styles.cardDescription}>Recevoir des dons</Text>
            <Ionicons name="arrow-forward" size={24} color={Colors.muted} style={styles.arrow} />
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  welcomeText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.xl,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.lg,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: '80%',
  },
  optionsContainer: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.xl,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
  },
  arrow: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
  },
});
