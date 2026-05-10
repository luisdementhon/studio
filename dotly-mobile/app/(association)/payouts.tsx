import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AssociationPayouts() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchPayouts = async () => {
      try {
        const payoutsRef = collection(db, 'associations', user.uid, 'payouts');
        const q = query(payoutsRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        setPayouts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn('Error fetching payouts:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, [user]);

  const totalPayouts = payouts.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.mint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Versements</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.topLabel}>TOTAL REÇU</Text>
          <Text style={styles.topValue}>{totalPayouts.toLocaleString('fr-FR')}€</Text>
          <View style={styles.nextPayout}>
            <Ionicons name="information-circle" size={16} color={Colors.coral} />
            <Text style={styles.nextPayoutText}>Prochain virement prévu le 01 du mois</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Historique</Text>

        {payouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={64} color={Colors.muted} />
            <Text style={styles.emptyText}>Aucun versement pour le moment</Text>
          </View>
        ) : (
          payouts.map((item) => (
            <View key={item.id} style={styles.payoutItem}>
              <View style={styles.payoutIcon}>
                <Ionicons name="arrow-down-outline" size={20} color={Colors.mint} />
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutDate}>
                  {item.date?.toDate ? format(item.date.toDate(), 'd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
                </Text>
                <Text style={styles.payoutRef}>Réf: {item.reference || 'N/A'}</Text>
              </View>
              <View style={styles.payoutAmountContainer}>
                <Text style={styles.payoutAmount}>{Number(item.amount || 0).toFixed(2)}€</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.xl,
    color: Colors.foreground,
  },
  content: {
    padding: Spacing.lg,
  },
  topCard: {
    backgroundColor: Colors.mint,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  topLabel: {
    fontFamily: 'Bricolage-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  topValue: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 40,
    color: '#fff',
    letterSpacing: -1,
  },
  nextPayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  nextPayoutText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: 10,
    color: '#fff',
  },
  sectionTitle: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutDate: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: Colors.foreground,
  },
  payoutRef: {
    fontFamily: 'Bricolage',
    fontSize: 10,
    color: Colors.muted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  payoutAmountContainer: {
    backgroundColor: Colors.foreground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  payoutAmount: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: '#fff',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
    marginTop: Spacing.md,
  },
});
