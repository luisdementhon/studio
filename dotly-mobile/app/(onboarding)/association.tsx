import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function AssociationOnboarding() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    associationName: '',
    representativeName: '',
    rnaNumber: '',
    contactEmail: user?.email || '',
    description: '',
    fundraisingGoal: '',
    currentMissions: '',
  });

  const handleFinish = async () => {
    if (!form.associationName || !form.rnaNumber) return;
    
    setLoading(true);
    try {
      if (user) {
        // Create association profile
        await setDoc(doc(db, 'associations', user.uid), {
          ...form,
          fundraisingGoal: Number(form.fundraisingGoal) || 0,
          role: 'association',
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Update user role and onboarding status
        await setDoc(doc(db, 'users', user.uid), {
          role: 'association',
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Profil Association</Text>
            <Text style={styles.subtitle}>Complétez les informations pour commencer à collecter des dons sur Dotly.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l'association</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Les Restos du Coeur"
                value={form.associationName}
                onChangeText={(text) => setForm({ ...form, associationName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du représentant</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                value={form.representativeName}
                onChangeText={(text) => setForm({ ...form, representativeName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro RNA</Text>
              <TextInput
                style={styles.input}
                placeholder="W123456789"
                autoCapitalize="characters"
                value={form.rnaNumber}
                onChangeText={(text) => setForm({ ...form, rnaNumber: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email de contact</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@asso.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.contactEmail}
                onChangeText={(text) => setForm({ ...form, contactEmail: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Objectif de collecte (€ / an)</Text>
              <TextInput
                style={styles.input}
                placeholder="5000"
                keyboardType="numeric"
                value={form.fundraisingGoal}
                onChangeText={(text) => setForm({ ...form, fundraisingGoal: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Missions actuelles</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Quelles sont vos actions prioritaires ?"
                multiline
                numberOfLines={3}
                value={form.currentMissions}
                onChangeText={(text) => setForm({ ...form, currentMissions: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description complète</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez votre mission globale..."
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={(text) => setForm({ ...form, description: text })}
              />
            </View>

            <Button 
              title="Finaliser l'inscription" 
              onPress={handleFinish} 
              loading={loading}
              disabled={!form.associationName || !form.rnaNumber}
            />
          </View>

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
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});
