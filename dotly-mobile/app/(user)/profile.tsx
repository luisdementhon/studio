import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { DotlyBrand } from '@/components/DotlyBrand';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { fetchApi } from '@/lib/api';
import { useStripe } from '@stripe/stripe-react-native';

type UserData = {
  firstName?: string;
  lastName?: string;
  fullName?: string; // Virtual for UI
  causes?: string[];
  donationCeiling?: number;
  donationMultiplier?: number;
  bankConnected?: boolean;
  bankName?: string;
  paymentMethodLinked?: boolean;
  cardBrand?: string;
  cardLast4?: string;
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isConnectingBank, setIsConnectingBank] = useState(false);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData({
            ...data,
            fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Dotly User'
          });
        }
      } catch (e) {
        console.warn('Error fetching profile:', e);
      }
    };
    fetchUser();
  }, [user]);

  const handleUpdateField = async (field: keyof UserData, value: any) => {
    if (!user) return;
    try {
      let updateData: any = { [field]: value };
      
      // Special case for fullName to split into firstName/lastName
      if (field === 'fullName') {
        const [firstName, ...lastNameParts] = (value as string).split(' ');
        const lastName = lastNameParts.join(' ');
        updateData = { firstName, lastName };
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
      setUserData(prev => prev ? { ...prev, ...updateData, [field]: value } : null);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  const handleEditName = () => {
    Alert.prompt(
      'Modifier le nom',
      'Entrez votre nouveau nom complet',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Enregistrer', onPress: (val: string | undefined) => val && handleUpdateField('fullName', val) }
      ],
      'plain-text',
      userData?.fullName || ''
    );
  };

  const handleConnectBank = async () => {
    if (!user) return;
    setIsConnectingBank(true);
    try {
      const callbackUrl = Linking.createURL('profile/bank-success');
      const response = await fetchApi('/api/bridge/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userId: user.uid, callbackUrl }),
      });
      if (!response.ok) throw new Error('Bridge error');
      const { redirect_url } = await response.json();
      const result = await WebBrowser.openAuthSessionAsync(redirect_url, callbackUrl);
      if (result.type === 'success') {
        handleUpdateField('bankConnected', true);
        handleUpdateField('bankName', 'Compte lié');
      }
    } catch (e) {
      console.error('Bridge error:', e);
      Alert.alert('Erreur', 'Impossible de connecter la banque.');
    } finally {
      setIsConnectingBank(false);
    }
  };

  const handleSetupStripe = async () => {
    if (!user) return;
    setIsSettingUpStripe(true);
    try {
      // 1. Appeler l'API Next.js pour créer un SetupIntent
      const response = await fetchApi('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      
      const { clientSecret, error } = await response.json();
      if (error) throw new Error(error);

      // 2. Initialiser le Payment Sheet de Stripe
      const { error: sheetError } = await initPaymentSheet({
        setupIntentClientSecret: clientSecret,
        merchantDisplayName: 'Dotly',
        allowsDelayedPaymentMethods: true,
      });

      if (sheetError) throw new Error(sheetError.message);

      // 3. Présenter le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === 'Canceled') return;
        throw new Error(presentError.message);
      }

      // 4. Succès ! Mettre à jour Firestore
      await handleUpdateField('paymentMethodLinked', true);
      await handleUpdateField('cardBrand', 'Visa'); // Mock simplified
      await handleUpdateField('cardLast4', '4242'); // Mock simplified
      
      Alert.alert('Succès', 'Votre carte a été enregistrée avec succès.');
    } catch (e: any) {
      console.error('Stripe error:', e);
      Alert.alert('Erreur', e.message || 'Impossible de configurer le paiement.');
    } finally {
      setIsSettingUpStripe(false);
    }
  };

  const handleDisconnectBank = () => {
    Alert.alert(
      'Déconnecter la banque',
      'Vos arrondis seront suspendus. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnecter', style: 'destructive', onPress: () => handleUpdateField('bankConnected', false) }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu es sûr(e) de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => signOut(auth),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>
            Mon Profil.
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.fullName?.[0]?.toUpperCase() || 'D'}
            </Text>
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
            <Text style={styles.profileName}>
              {userData?.fullName || 'Dotly User'}
            </Text>
            <TouchableOpacity onPress={handleEditName}>
              <Ionicons name="pencil" size={16} color={Colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES DE DON</Text>

          <View style={styles.premiumCard}>
            <View style={styles.settingHeader}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.coralLight }]}>
                <Ionicons name="flash" size={18} color={Colors.coral} />
              </View>
              <Text style={styles.settingLabel}>Multiplicateur</Text>
              <Text style={styles.premiumValue}>×{userData?.donationMultiplier || 1}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={userData?.donationMultiplier || 1}
              onSlidingComplete={(val) => handleUpdateField('donationMultiplier', val)}
              minimumTrackTintColor={Colors.coral}
              maximumTrackTintColor={Colors.mutedBackground}
              thumbTintColor={Colors.coral}
            />
            <Text style={styles.sliderSub}>Multiplie tes arrondis pour donner plus.</Text>
          </View>

          <View style={styles.premiumCard}>
            <View style={styles.settingHeader}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.mintLight }]}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.mint} />
              </View>
              <Text style={styles.settingLabel}>Plafond mensuel</Text>
              <Text style={styles.premiumValue}>{userData?.donationCeiling || 50}€</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={200}
              step={5}
              value={userData?.donationCeiling || 50}
              onSlidingComplete={(val) => handleUpdateField('donationCeiling', val)}
              minimumTrackTintColor={Colors.mint}
              maximumTrackTintColor={Colors.mutedBackground}
              thumbTintColor={Colors.mint}
            />
            <Text style={styles.sliderSub}>Le montant maximum que tu souhaites donner par mois.</Text>
          </View>
        </View>

        {/* Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTES & CONNEXIONS</Text>
          
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={userData?.bankConnected ? handleDisconnectBank : handleConnectBank}
            disabled={isConnectingBank}
          >
            <View style={[styles.settingIcon, { backgroundColor: Colors.yellowLight }]}>
              <Ionicons name="business" size={18} color={Colors.yellow} />
            </View>
            <View style={styles.settingContent}>
              <View>
                <Text style={styles.settingLabel}>Banque (Arrondis)</Text>
                <Text style={styles.settingSub}>{userData?.bankConnected ? userData.bankName : 'Lien sécurisé via Bridge'}</Text>
              </View>
              <View style={styles.valueGroup}>
                {isConnectingBank ? (
                  <ActivityIndicator size="small" color={Colors.coral} />
                ) : (
                  <>
                    <Text style={[styles.settingValue, !userData?.bankConnected && {color: Colors.coral}]}>
                      {userData?.bankConnected ? 'Connecté' : 'Lier'}
                    </Text>
                    <Ionicons 
                      name={userData?.bankConnected ? "checkmark-circle" : "chevron-forward"} 
                      size={18} 
                      color={userData?.bankConnected ? Colors.mint : Colors.coral} 
                    />
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={handleSetupStripe}
            disabled={isSettingUpStripe}
          >
            <View style={[styles.settingIcon, { backgroundColor: Colors.lavenderLight }]}>
              <Ionicons name="card" size={18} color={Colors.lavender} />
            </View>
            <View style={styles.settingContent}>
              <View>
                <Text style={styles.settingLabel}>Paiement (Prélèvements)</Text>
                <Text style={styles.settingSub}>
                  {userData?.paymentMethodLinked 
                    ? `${userData.cardBrand} •••• ${userData.cardLast4}` 
                    : 'Carte de crédit sécurisée'}
                </Text>
              </View>
              <View style={styles.valueGroup}>
                {isSettingUpStripe ? (
                  <ActivityIndicator size="small" color={Colors.coral} />
                ) : (
                  <>
                    <Text style={[styles.settingValue, !userData?.paymentMethodLinked && {color: Colors.coral}]}>
                      {userData?.paymentMethodLinked ? 'Actif' : 'Ajouter'}
                    </Text>
                    <Ionicons 
                      name={userData?.paymentMethodLinked ? "checkmark-circle" : "chevron-forward"} 
                      size={18} 
                      color={userData?.paymentMethodLinked ? Colors.mint : Colors.coral} 
                    />
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Causes */}
        {userData?.causes && userData.causes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MES CAUSES ACTIVES</Text>
            <View style={styles.causesGrid}>
              {userData.causes.map((cause, i) => (
                <View key={i} style={styles.causeBadge}>
                  <Text style={styles.causeText}>{cause}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plateforme</Text>
            <DotlyBrand size={16} />
          </View>
        </View>

        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleAccent: {
    fontStyle: 'italic',
    color: Colors.lavender,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FontSizes.xxl,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: FontSizes.base,
    color: Colors.muted,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  settingRow: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.foreground,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.foreground,
  },
  causesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  causeBadge: {
    backgroundColor: Colors.coralLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  causeText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.coral,
    textTransform: 'uppercase',
  },
  infoRow: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSizes.base,
    fontWeight: '500',
    color: Colors.muted,
  },
  infoValue: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.foreground,
  },
  premiumCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  premiumValue: {
    marginLeft: 'auto',
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.foreground,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderSub: {
    fontSize: 10,
    color: Colors.muted,
    fontStyle: 'italic',
    marginTop: -4,
  },
});
