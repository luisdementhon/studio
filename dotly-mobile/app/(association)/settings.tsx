import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes } from '@/constants/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Se déconnecter", style: "destructive", onPress: () => signOut() }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = Colors.foreground }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Compte Association</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <SettingItem 
            icon="person-outline" 
            title="Informations de l'association" 
            onPress={() => router.push('/(association)/profile')} 
          />
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            onPress={() => {}} 
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Sécurité & Confidentialité" 
            onPress={() => {}} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aide & Support</Text>
          <SettingItem 
            icon="help-circle-outline" 
            title="Centre d'aide" 
            onPress={() => {}} 
          />
          <SettingItem 
            icon="document-text-outline" 
            title="Conditions d'utilisation" 
            onPress={() => {}} 
          />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.coral} />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0 (Beta)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 32,
    color: Colors.foreground,
    letterSpacing: -1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontFamily: 'Bricolage-Bold',
  },
  email: {
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    fontFamily: 'Bricolage-Bold',
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.coral + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: Colors.coral,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.coral + '10',
    padding: Spacing.md,
    borderRadius: 16,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  signOutText: {
    color: Colors.coral,
    fontSize: FontSizes.base,
    fontFamily: 'Bricolage-Bold',
  },
  version: {
    textAlign: 'center',
    color: Colors.muted,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  }
});
