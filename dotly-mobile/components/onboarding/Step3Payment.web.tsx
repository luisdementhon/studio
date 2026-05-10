import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';

export const Step3Payment = ({ onNext }: { onNext: () => void }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mode Web : Paiement désactivé</Text>
      <Text style={styles.description}>
        Le module de paiement Stripe est désactivé sur la prévisualisation Web. 
        Sur le vrai téléphone, ce sera le vrai formulaire de carte bancaire.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Text style={styles.dummyButton} onPress={onNext}>
          Passer l'étape (Simulation)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    width: '100%',
  },
  dummyButton: {
    backgroundColor: Colors.coral,
    color: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontFamily: 'Bricolage-Bold',
    overflow: 'hidden',
  }
});
