import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { DotlyBrand } from '@/components/DotlyBrand';

type AssociationData = {
  associationName?: string;
  representativeName?: string;
  rnaNumber?: string;
  fundraisingGoal?: number;
  currentMissions?: string;
  description?: string;
  contactEmail?: string;
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const [assocData, setAssocData] = useState<AssociationData | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAssoc = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'associations', user.uid));
        if (docSnap.exists()) {
          setAssocData(docSnap.data() as AssociationData);
        }
      } catch (e) {
        console.warn('Error fetching association profile:', e);
      }
    };
    fetchAssoc();
  }, [user]);

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
        <Text style={styles.title}>
          Mon{'\n'}
          <Text style={styles.titleAccent}>Profil.</Text>
        </Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {assocData?.associationName?.[0]?.toUpperCase() || 'A'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {assocData?.associationName || 'Association'}
          </Text>
          <Text style={styles.profileEmail}>{assocData?.contactEmail || user?.email || ''}</Text>
        </View>

        {/* Association Info Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFOS LÉGALES</Text>

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.coralLight }]}>
              <Ionicons name="business" size={18} color={Colors.coral} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Numéro RNA</Text>
              <Text style={styles.settingValue}>{assocData?.rnaNumber || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.mintLight }]}>
              <Ionicons name="person" size={18} color={Colors.mint} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Représentant</Text>
              <Text style={styles.settingValue}>{assocData?.representativeName || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.yellowLight }]}>
              <Ionicons name="trending-up" size={18} color={Colors.yellow} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Objectif annuel</Text>
              <Text style={styles.settingValue}>{assocData?.fundraisingGoal?.toLocaleString('fr-FR') || '0'} €</Text>
            </View>
          </View>
        </View>

        {/* Missions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOS MISSIONS</Text>
          <View style={styles.premiumCard}>
            <Text style={styles.missionText}>{assocData?.currentMissions || 'Aucune mission renseignée.'}</Text>
          </View>
        </View>


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
    lineHeight: 42,
    marginBottom: Spacing.xl,
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
    fontWeight: '600',
    color: Colors.foreground,
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
  },
  missionText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.foreground,
    lineHeight: 24,
  },
});
