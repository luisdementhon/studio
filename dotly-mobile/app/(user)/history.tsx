import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/lib/auth-context';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type DonationItem = {
  id: string;
  amount: number;
  associationId: string;
  transactionDate: any;
  associationName?: string;
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        // Fetch Associations to map names
        const assosMap: Record<string, string> = {};
        const assosRef = collection(db, 'associations');
        const assosSnap = await getDocs(assosRef);
        assosSnap.forEach(d => {
          assosMap[d.id] = d.data().associationName || 'Asso';
        });

        // Fetch Donations
        const donationsRef = collection(db, 'users', user.uid, 'donations');
        const q = query(donationsRef, orderBy('transactionDate', 'desc'));
        const donSnap = await getDocs(q);
        
        const donsList = donSnap.docs.map(d => {
          const data = d.data();
          const rawDate = data.transactionDate;
          const dateObj = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date();
          return {
            id: d.id,
            amount: Number(data.amount) || 0,
            associationId: data.associationId,
            transactionDate: dateObj,
            associationName: assosMap[data.associationId] || 'Association',
          } as DonationItem;
        });

        setDonations(donsList);
      } catch (e) {
        console.warn('Error fetching history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const renderItem = ({ item }: { item: DonationItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemIcon}>
        <Text style={styles.itemIconText}>{item.associationName?.charAt(0)}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.associationName}</Text>
        <Text style={styles.itemDate}>
          {format(item.transactionDate, 'dd MMMM yyyy', { locale: fr })}
        </Text>
      </View>
      <Text style={styles.itemAmount}>{item.amount.toFixed(2)} €</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Mes{'\n'}
          <Text style={styles.titleAccent}>Arrondis.</Text>
        </Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.coral} />
          </View>
        ) : donations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color={Colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>Aucun arrondi pour le moment</Text>
            <Text style={styles.emptyText}>
              Connecte ta banque et tes premiers arrondis apparaîtront ici automatiquement.
            </Text>
          </View>
        ) : (
          <FlatList
            data={donations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
    color: Colors.coral,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  listContainer: {
    paddingBottom: 120,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  itemIconText: {
    color: Colors.mint,
    fontWeight: '800',
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  itemAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.coral,
  },
});
