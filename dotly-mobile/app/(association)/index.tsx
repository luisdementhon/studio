import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AssociationDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [associationData, setAssociationData] = useState<any>(null);
  const [stats, setStats] = useState({
    monthlyFunds: 0,
    uniqueDonors: 0,
    totalFunds: 0,
    avgDonation: 0,
    growth: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [recentDonors, setRecentDonors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch association profile
        const assocDoc = await getDoc(doc(db, 'associations', user.uid));
        if (assocDoc.exists()) {
          setAssociationData(assocDoc.data());
        }

        // Fetch donations stats
        const donationsRef = collection(db, 'associations', user.uid, 'donations');
        const q = query(donationsRef, orderBy('transactionDate', 'asc')); // Ascending for chart
        const snapshot = await getDocs(q);
        
        let total = 0;
        let monthly = 0;
        let prevMonthly = 0;
        const donors = new Set();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // For chart: group by month for the last 6 months
        const monthlyData: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = format(d, 'MMM', { locale: fr });
          monthlyData[key] = 0;
        }

        snapshot.docs.forEach(d => {
          const data = d.data();
          const amount = Number(data.amount || 0);
          total += amount;
          donors.add(data.userId);

          const date = data.transactionDate?.toDate() || new Date();
          if (date >= startOfMonth) {
            monthly += amount;
          } else if (date >= startOfLastMonth) {
            prevMonthly += amount;
          }

          const monthKey = format(date, 'MMM', { locale: fr });
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += amount;
          }
        });

        const formattedChartData = Object.entries(monthlyData).map(([label, value]) => ({
          value,
          label,
        }));

        // Calculate growth
        // Calculate growth (aligned with web logic)
        const growth = prevMonthly > 0 ? ((monthly - prevMonthly) / prevMonthly) * 100 : monthly > 0 ? 100 : 0;

        // If all values are 0, we still want to show the months on the X axis
        setChartData(formattedChartData);
        setStats({
          monthlyFunds: monthly,
          uniqueDonors: donors.size,
          totalFunds: total,
          avgDonation: snapshot.docs.length > 0 ? total / snapshot.docs.length : 0,
          growth: growth,
        });
        const recentQuery = query(donationsRef, orderBy('transactionDate', 'desc'), limit(3));
        const recentSnap = await getDocs(recentQuery);
        const recentList = recentSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            amount: Number(data.amount || 0),
            transactionDate: data.transactionDate?.toDate() || new Date(),
          };
        });

        setRecentDonors(recentList);
      } catch (e) {
        console.warn('Error fetching association stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Tableau de{'\n'}
            <Text style={styles.titleAccent}>Bord.</Text>
          </Text>
          <DotlyBrand size={24} />
        </View>

        <Text style={styles.welcome}>
          Bonjour, <Text style={styles.assocName}>{associationData?.associationName || 'votre association'}</Text> 🌿
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.coral }]}>
            <View>
              <Text style={styles.statLabel}>CE MOIS-CI</Text>
              <Text style={styles.statValue}>{stats.monthlyFunds.toFixed(0)}€</Text>
            </View>
            {stats.growth !== 0 && (
              <View style={styles.growthBadge}>
                <Ionicons 
                  name={stats.growth > 0 ? "trending-up" : "trending-down"} 
                  size={12} 
                  color="#fff" 
                />
                <Text style={styles.growthText}>
                  {stats.growth > 0 ? '+' : ''}{stats.growth.toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.mint }]}>
            <View>
              <Text style={styles.statLabel}>DON MOYEN</Text>
              <Text style={styles.statValue}>{stats.avgDonation.toFixed(1)}€</Text>
            </View>
            <View style={styles.growthBadge}>
              <Text style={styles.growthText}>{stats.uniqueDonors} donateurs</Text>
            </View>
          </View>
        </View>

        <View style={styles.statCardWide}>
          <Text style={styles.statLabelMuted}>TOTAL RÉCOLTÉ</Text>
          <Text style={styles.statValueLarge}>{stats.totalFunds.toLocaleString('fr-FR')}€</Text>
          
          <View style={{ marginTop: 20, marginLeft: -10 }}>
            <LineChart
              data={chartData}
              width={width - Spacing.lg * 4}
              height={140}
              thickness={4}
              color={Colors.mint}
              hideRules
              hideYAxisText
              hideAxesAndRules
              curved
              initialSpacing={10}
              paddingRight={20}
              endSpacing={0}
              dataPointsColor={Colors.mint}
              dataPointsRadius={4}
              textColor={Colors.muted}
              textFontSize={10}
              noOfSections={3}
              maxValue={Math.max(...chartData.map(d => d.value), 10)}
              LineGradientComponent={LinearGradient}
            />
          </View>
        </View>

        {/* Progress to Goal */}
        {associationData?.fundraisingGoal > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Objectif de collecte</Text>
              <Text style={styles.goalPercent}>
                {Math.min(100, (stats.totalFunds / associationData.fundraisingGoal) * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, (stats.totalFunds / associationData.fundraisingGoal) * 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.goalSub}>
              {stats.totalFunds.toLocaleString('fr-FR')}€ récoltés sur {associationData.fundraisingGoal.toLocaleString('fr-FR')}€
            </Text>
          </View>
        )}

        {/* Menu Actions */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(association)/payouts')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.mintLight }]}>
              <Ionicons name="card" size={24} color={Colors.mint} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Versements</Text>
              <Text style={styles.menuSub}>Historique de vos virements</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(association)/tax-receipts')}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.coralLight }]}>
              <Ionicons name="document-text" size={24} color={Colors.coral} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Reçus Fiscaux</Text>
              <Text style={styles.menuSub}>Documents pour vos donateurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Derniers Donateurs */}
        <View style={styles.recentDonorsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Derniers Donateurs</Text>
            <TouchableOpacity onPress={() => router.push('/(association)/donors')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {recentDonors.length === 0 ? (
            <Text style={styles.emptyRecent}>Aucun don pour le moment.</Text>
          ) : (
            recentDonors.map((donor) => (
              <View key={donor.id} style={styles.donorRow}>
                <View style={styles.donorAvatar}>
                  <Ionicons name="person" size={16} color={Colors.coral} />
                </View>
                <View style={styles.donorInfo}>
                  <Text style={styles.donorName}>Donateur Anonyme</Text>
                  <Text style={styles.donorDate}>
                    {format(donor.transactionDate, 'dd MMMM', { locale: fr })}
                  </Text>
                </View>
                <Text style={styles.donorAmount}>+{donor.amount.toFixed(2)}€</Text>
              </View>
            ))
          )}
        </View>
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
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.hero,
    color: Colors.foreground,
    letterSpacing: -1,
    lineHeight: 42,
  },
  titleAccent: {
    fontFamily: 'Instrument-Italic',
    color: Colors.coral,
  },
  welcome: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.xl,
    color: Colors.foreground,
    marginBottom: Spacing.xl,
    lineHeight: 30,
  },
  assocName: {
    fontFamily: 'Instrument-Italic',
    fontWeight: 'bold',
    color: Colors.coral,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statCardWide: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  statLabel: {
    fontFamily: 'Bricolage-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
  },
  statLabelMuted: {
    fontFamily: 'Bricolage-Bold',
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.muted,
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 32,
    color: '#fff',
    letterSpacing: -1,
  },
  statValueLarge: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 48,
    color: Colors.foreground,
    letterSpacing: -2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  growthText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Bricolage-Bold',
  },
  goalCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goalTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.base,
    color: Colors.foreground,
  },
  goalPercent: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.lg,
    color: Colors.coral,
  },
  progressBg: {
    height: 12,
    backgroundColor: Colors.mutedBackground,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.coral,
    borderRadius: 6,
  },
  goalSub: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
  menuContainer: {
    gap: Spacing.md,
  },
  menuItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
  },
  menuSub: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: 2,
  },
  recentDonorsContainer: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
  },
  seeAllText: {
    color: Colors.coral,
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
  },
  emptyRecent: {
    color: Colors.muted,
    fontFamily: 'Bricolage',
    fontStyle: 'italic',
    padding: Spacing.md,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  donorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.base,
    color: Colors.foreground,
  },
  donorDate: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.xs,
    color: Colors.muted,
  },
  donorAmount: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: FontSizes.base,
    color: Colors.mint,
  },
});
