import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/Theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Slider } from '@/components/Slider';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';

const causes = [
  { id: 'env', label: 'Environnement', icon: '🌱' },
  { id: 'edu', label: 'Éducation', icon: '📚' },
  { id: 'health', label: 'Santé', icon: '🏥' },
  { id: 'animals', label: 'Animaux', icon: '🐾' },
  { id: 'social', label: 'Social', icon: '🤝' },
  { id: 'culture', label: 'Culture', icon: '🎨' },
];

const UserOnboardingSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet est requis'),
  causes: z.array(z.string()).min(1, 'Sélectionnez au moins une cause'),
  otherCause: z.string().optional(),
  donationMultiplier: z.number().min(1).max(10),
  donationCeiling: z.number().min(5).max(200),
});

type OnboardingData = z.infer<typeof UserOnboardingSchema>;

interface Step1ProfileProps {
  onNext: () => void;
}

export function Step1Profile({ onNext }: Step1ProfileProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingData>({
    resolver: zodResolver(UserOnboardingSchema),
    defaultValues: {
      fullName: '',
      causes: [],
      otherCause: '',
      donationMultiplier: 1,
      donationCeiling: 50,
    },
  });

  const watchedCauses = watch('causes');
  const watchedMultiplier = watch('donationMultiplier');

  const onSubmit = async (data: OnboardingData) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { fullName, ...preferences } = data;
      const [firstName, ...lastNameParts] = (fullName || '').split(' ');
      const lastName = lastNameParts.join(' ');

      const userProfile = {
        id: user.uid,
        email: user.email,
        firstName,
        lastName,
        ...preferences,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
      onNext();
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Would normally show a toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCause = (causeId: string) => {
    const currentCauses = watchedCauses || [];
    if (currentCauses.includes(causeId)) {
      setValue('causes', currentCauses.filter(id => id !== causeId), { shouldValidate: true });
    } else {
      setValue('causes', [...currentCauses, causeId], { shouldValidate: true });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Nom complet</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Votre prénom et nom"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Vos causes favorites</Text>
          <View style={styles.causesGrid}>
            {causes.map((cause) => {
              const isSelected = watchedCauses?.includes(cause.id);
              return (
                <TouchableOpacity
                  key={cause.id}
                  style={[styles.causeButton, isSelected && styles.causeButtonSelected]}
                  onPress={() => toggleCause(cause.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.causeText, isSelected && styles.causeTextSelected]}>
                    {cause.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity
              style={[styles.causeButton, watchedCauses?.includes('autre') && styles.causeButtonSelected]}
              onPress={() => toggleCause('autre')}
              activeOpacity={0.7}
            >
              <Text style={[styles.causeText, watchedCauses?.includes('autre') && styles.causeTextSelected]}>
                Autre cause...
              </Text>
            </TouchableOpacity>
          </View>
          {errors.causes && <Text style={styles.errorText}>{errors.causes.message}</Text>}

          {watchedCauses?.includes('autre') && (
            <View style={{ marginTop: Spacing.md }}>
              <Controller
                control={control}
                name="otherCause"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Précisez la cause"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Controller
            control={control}
            name="donationMultiplier"
            render={({ field: { onChange, value } }) => (
              <Slider
                minimumValue={1}
                maximumValue={10}
                step={0.5}
                value={value}
                onValueChange={onChange}
                label={`Multiplicateur : x${value}`}
                rightAddon={
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Env. {(value * 12.5).toFixed(2)}€ / mois</Text>
                  </View>
                }
                bottomText="* Basé sur une moyenne de 25 transactions par mois (0,50€ d'arrondi moyen)."
              />
            )}
          />
        </View>

        <View style={[styles.formSection, { marginBottom: Spacing.xl }]}>
          <Controller
            control={control}
            name="donationCeiling"
            render={({ field: { onChange, value } }) => (
              <Slider
                minimumValue={5}
                maximumValue={200}
                step={5}
                value={value}
                onValueChange={onChange}
                label="Plafond mensuel"
                rightAddon={
                  <Text style={styles.ceilingValue}>{value}€</Text>
                }
                bottomText="Minimum 5€"
              />
            )}
          />
        </View>

        <Button 
          title="Continuer" 
          onPress={handleSubmit(onSubmit)} 
          variant="vibrant"
          loading={isSubmitting}
          icon={<Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: -8, marginRight: 8 }} />}
          style={{ flexDirection: 'row-reverse' }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingVertical: Spacing.xl,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  causesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  causeButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(161, 161, 170, 0.3)',
    backgroundColor: 'rgba(161, 161, 170, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  causeButtonSelected: {
    borderColor: Colors.coral,
    backgroundColor: 'rgba(251, 139, 123, 0.05)',
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  causeText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.muted,
    textAlign: 'center',
  },
  causeTextSelected: {
    color: Colors.coral,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: 'rgba(251, 139, 123, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontFamily: 'Bricolage-Bold',
    color: Colors.coral,
    fontSize: FontSizes.xs,
  },
  ceilingValue: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.xl,
    color: Colors.coral,
  },
});
