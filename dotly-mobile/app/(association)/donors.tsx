import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Donor {
  id: string;
  fullName: string;
  email: string;
  totalDonated: number;
}

export default function DonorsScreen() {
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const donationsRef = collection(db, 'associations', user.uid, 'donations');
    const q = query(donationsRef, orderBy('transactionDate', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const fetchedDonations = snap.docs.map(doc => {
        const data = doc.data();
        const rawDate = data.transactionDate;
        const dateObj = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date();
        return {
          id: doc.id,
          fullName: 'Donateur Anonyme',
          email: '***@***.com',
          amount: Number(data.amount || 0),
          date: dateObj
        };
      });
      setDonors(fetchedDonations as any);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching donations:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Nos{'\n'}
          <Text style={styles.titleAccent}>Donateurs.</Text>
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{donors.length}</Text>
              <Text style={styles.statLabel}>Contributions reçues</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Détail des contributions</Text>
          
          {donors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.muted} />
              <Text style={styles.emptyStateText}>Aucun donateur pour le moment.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {donors.map(donor => (
                <View key={donor.id} style={styles.donorRow}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={Colors.coral} />
                  </View>
                  <View style={styles.donorInfo}>
                    <Text style={styles.donorName}>{(donor as any).fullName}</Text>
                    <Text style={styles.donorEmail}>
                      {(donor as any).date ? format((donor as any).date, 'd MMM yyyy', { locale: fr }) : ''}
                    </Text>
                  </View>
                  <View style={styles.donorAmount}>
                    <Text style={styles.amountText}>{(donor as any).amount.toFixed(2)} €</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 36,
    color: Colors.foreground,
    lineHeight: 40,
  },
  titleAccent: {
    color: Colors.coral,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  statValue: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.xxl,
    color: Colors.coral,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
  },
  emptyStateText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
    marginTop: Spacing.sm,
  },
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: Colors.coral,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: Colors.foreground,
    marginBottom: 2,
  },
  donorEmail: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
  donorAmount: {
    backgroundColor: Colors.mintLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  amountText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.xs,
    color: Colors.mint,
  },
});
