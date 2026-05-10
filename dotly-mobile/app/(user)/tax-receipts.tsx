import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function UserTaxReceipts() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchReceipts = async () => {
      try {
        // En réalité, on récupère les reçus fiscaux générés pour l'utilisateur
        // Ou on calcule un résumé par année
        const donationsRef = collection(db, 'users', user.uid, 'donations');
        const snapshot = await getDocs(donationsRef);
        
        const summaryByYear: Record<number, number> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const date = data.transactionDate?.toDate() || new Date();
          const year = date.getFullYear();
          summaryByYear[year] = (summaryByYear[year] || 0) + Number(data.amount || 0);
        });

        const formatted = Object.entries(summaryByYear).map(([year, amount]) => ({
          id: year,
          year: parseInt(year),
          totalAmount: amount,
          status: 'Disponible'
        })).sort((a, b) => b.year - a.year);

        setReceipts(formatted);
      } catch (e) {
        console.warn('Error fetching tax receipts:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.coral} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Reçus Fiscaux</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topCard}>
          <Text style={styles.topLabel}>DONS CUMULÉS</Text>
          <Text style={styles.topValue}>
            {receipts.reduce((acc, r) => acc + r.totalAmount, 0).toFixed(2)}€
          </Text>
          <Text style={styles.topSub}>Retrouvez vos attestations de dons par année.</Text>
        </View>

        <Text style={styles.sectionTitle}>Mes attestations</Text>

        {receipts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={Colors.muted} />
            <Text style={styles.emptyText}>Aucun reçu disponible</Text>
            <Text style={styles.emptySub}>Vos reçus sont générés dès que vous commencez à donner.</Text>
          </View>
        ) : (
          receipts.map((item) => (
            <View key={item.id} style={styles.receiptItem}>
              <View style={styles.receiptIcon}>
                <Ionicons name="ribbon" size={24} color={Colors.coral} />
              </View>
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptYear}>Année {item.year}</Text>
                <Text style={styles.receiptStatus}>{item.status}</Text>
              </View>
              <View style={styles.receiptAction}>
                <Text style={styles.amountText}>{item.totalAmount.toFixed(2)}€</Text>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Ionicons name="download-outline" size={18} color={Colors.coral} />
                </TouchableOpacity>
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  topLabel: {
    fontFamily: 'Bricolage-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  topValue: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 48,
    color: Colors.foreground,
    letterSpacing: -2,
  },
  topSub: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptYear: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.md,
    color: Colors.foreground,
  },
  receiptStatus: {
    fontFamily: 'Bricolage',
    fontSize: 12,
    color: Colors.mint,
    marginTop: 2,
  },
  receiptAction: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.coral,
    backgroundColor: Colors.coralLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginTop: Spacing.md,
  },
  emptySub: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
});
