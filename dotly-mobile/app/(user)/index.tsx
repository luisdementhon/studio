import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { doc, getDoc, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { DotlyBrand } from '@/components/DotlyBrand';
import { LineChart } from 'react-native-gifted-charts';
import { fetchApi } from '@/lib/api';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type UserData = {
  fullName?: string;
  donationCeiling?: number;
  donationMultiplier?: number;
  causes?: string[];
  selectedAssociations?: string[];
  bankConnected?: boolean;
};

const causesLabels: { [key: string]: string } = {
  'environnement': 'Environnement',
  'pauvrete': 'Lutte contre la pauvreté',
  'sante': 'Santé & Recherche',
  'education': 'Éducation & Jeunesse',
  'animaux': 'Protection animale',
  'culture': 'Culture & Patrimoine',
  'humanitaire': 'Aide humanitaire',
  'social': 'Inclusion sociale',
  'autre': 'Autre'
};

export default function ImpactScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [associationsMap, setAssociationsMap] = useState<Record<string, string>>({});
  const [bridgeTotal, setBridgeTotal] = useState(0);
  const [bridgeLoading, setBridgeLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // 1. User Profile
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        let uData: UserData | null = null;
        if (docSnap.exists()) {
          uData = docSnap.data() as UserData;
          setUserData(uData);
        }

        // 2. Fetch Donations
        const donationsRef = collection(db, 'users', user.uid, 'donations');
        const q = query(donationsRef, orderBy('transactionDate', 'desc'));
        const donSnap = await getDocs(q);
        const donsList = donSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDonations(donsList);

        // 3. Fetch Associations names for the recent list
        const assosMap: Record<string, string> = {};
        const assosRef = collection(db, 'associations');
        const assosSnap = await getDocs(assosRef);
        assosSnap.forEach(d => {
          assosMap[d.id] = d.data().associationName || 'Asso';
        });
        setAssociationsMap(assosMap);

        // 4. Fetch Bridge Transactions (if connected)
        if (user.email && uData?.bankConnected) {
          setBridgeLoading(true);
          try {
            const bridgeRes = await fetchApi('/api/bridge/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: user.email, 
                userId: user.uid,
                multiplier: uData.donationMultiplier || 1
              }),
            });
            if (bridgeRes.ok) {
              const bData = await bridgeRes.json();
              setBridgeTotal(bData.totalDonations || 0);
            }
          } catch (e) {
            console.warn('Bridge API err:', e);
          } finally {
            setBridgeLoading(false);
          }
        }

      } catch (e) {
        console.warn('Error fetching user data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const { totalDonations, chartData, recentDonations } = useMemo(() => {
    if (!donations.length) {
      return { totalDonations: 0, chartData: [{value: 0}], recentDonations: [] };
    }
    
    // Total
    const total = donations.reduce((acc, d) => acc + Number(d.amount || 0), 0);
    
    // Chart (Derniers 30 jours)
    const startDate = subDays(new Date(), 30);
    const filtered = donations.filter(d => {
      const rawDate = d.transactionDate;
      const date = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date();
      return isAfter(date, startOfDay(startDate));
    });

    const dailyData: { [key: string]: number } = {};
    filtered.forEach(d => {
      const rawDate = d.transactionDate;
      const date = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date();
      const dateKey = format(date, 'dd MMM', { locale: fr });
      dailyData[dateKey] = (dailyData[dateKey] || 0) + Number(d.amount || 0);
    });

    let cData = Object.entries(dailyData).map(([label, value]) => ({
      value,
      label,
    }));
    
    if (cData.length === 0) {
      cData = [{value: 0, label: ""}]; // fallback pour GiftedCharts
    }

    // Recent 3
    const recent = donations.slice(0, 3).map(d => {
      const rawDate = d.transactionDate;
      const dateObj = (rawDate && typeof rawDate.toDate === 'function') ? rawDate.toDate() : new Date();
      return {
        ...d,
        associationName: associationsMap[d.associationId] || 'Association',
        transactionDate: dateObj,
      }
    });

    return { totalDonations: total, chartData: cData, recentDonations: recent };
  }, [donations, associationsMap]);

  const firstName = userData?.fullName?.split(' ')[0] || 'toi';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <DotlyBrand size={24} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {firstName[0]?.toUpperCase() || 'D'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greeting}>
          Salut{' '}
          <Text style={styles.greetingName}>{firstName}</Text> 👋
        </Text>
        <Text style={styles.subtitle}>
          Voici ton impact avec dotly<Text style={{ color: Colors.coral }}>.</Text>
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.coral} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: Colors.coral }]}>
                <Text style={styles.kpiLabel}>DONS VERSÉS</Text>
                <Text style={styles.kpiValue}>{totalDonations.toFixed(2)} €</Text>
                <Text style={styles.kpiSub}>depuis ton inscription</Text>
              </View>
              <TouchableOpacity 
                style={[styles.kpiCard, { backgroundColor: Colors.mint }]} 
                onPress={() => router.push('/history')}
                activeOpacity={0.8}
              >
                <Text style={styles.kpiLabel}>EN ATTENTE</Text>
                {bridgeLoading ? (
                  <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.kpiValue}>{bridgeTotal.toFixed(2)} €</Text>
                )}
                <Text style={styles.kpiSub}>arrondis en cours</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: Colors.lavender }]}>
                <Text style={styles.kpiLabel}>RÉDUCTION FISCALE</Text>
                <Text style={styles.kpiValue}>{(totalDonations * 0.66).toFixed(2)} €</Text>
                <Text style={styles.kpiSub}>potentiel (66%)</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: Colors.yellow }]}>
                <Text style={[styles.kpiLabel, { color: Colors.foreground }]}>CAUSES</Text>
                <Text style={[styles.kpiValue, { color: Colors.foreground }]}>{userData?.causes?.length || 0}</Text>
                <Text style={[styles.kpiSub, { color: Colors.foreground }]}>soutenues activement</Text>
              </View>
            </View>

            {/* Params Summary */}
            <View style={styles.paramsRow}>
              <View style={styles.paramItem}>
                <Ionicons name="flash" size={14} color={Colors.coral} />
                <Text style={styles.paramLabel}>Multiplicateur</Text>
                <Text style={styles.paramValue}>×{userData?.donationMultiplier || 1}</Text>
              </View>
              <View style={styles.paramItem}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.mint} />
                <Text style={styles.paramLabel}>Plafond</Text>
                <Text style={styles.paramValue}>{userData?.donationCeiling || 50}€</Text>
              </View>
              <TouchableOpacity 
                style={styles.paramEdit}
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="settings-outline" size={16} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Graphique */}
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Activité des dons</Text>
              <View style={{ marginTop: 20, alignItems: 'center' }}>
                <LineChart
                  data={chartData}
                  width={width - Spacing.lg * 4}
                  height={180}
                  thickness={3}
                  color={Colors.coral}
                  hideDataPoints
                  yAxisColor="transparent"
                  xAxisColor="transparent"
                  yAxisTextStyle={{ color: Colors.muted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: Colors.muted, fontSize: 10 }}
                  hideRules
                  initialSpacing={0}
                  endSpacing={0}
                  isAnimated
                  areaChart
                  startFillColor={Colors.coral}
                  startOpacity={0.3}
                  endFillColor={Colors.coral}
                  endOpacity={0.0}
                  LineGradientComponent={LinearGradient}
                />
              </View>
            </View>

            {/* Mes Causes */}
            <View style={styles.causesCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mes Causes</Text>
              </View>
              <View style={styles.causesList}>
                {userData?.causes?.map(c => (
                  <View key={c} style={styles.causeBadge}>
                    <Text style={styles.causeBadgeText}>{causesLabels[c] || c}</Text>
                  </View>
                ))}
                {(!userData?.causes || userData.causes.length === 0) && (
                  <Text style={{ color: Colors.muted }}>Aucune cause sélectionnée</Text>
                )}
              </View>
            </View>

            {/* Historique Récent */}
            <View style={styles.recentCard}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Historique Récent</Text>
                <TouchableOpacity onPress={() => router.push('/history')}>
                  <Text style={styles.seeAllText}>Tout voir</Text>
                </TouchableOpacity>
              </View>
              {recentDonations.length === 0 ? (
                <Text style={styles.emptyRecent}>Aucun don enregistré pour le moment.</Text>
              ) : (
                recentDonations.map(tx => (
                  <View key={tx.id} style={styles.recentItem}>
                    <View style={styles.recentItemIcon}>
                      <Text style={styles.recentItemIconText}>{tx.associationName.charAt(0)}</Text>
                    </View>
                    <View style={styles.recentItemInfo}>
                      <Text style={styles.recentItemName}>{tx.associationName}</Text>
                      <Text style={styles.recentItemDate}>
                        {format(tx.transactionDate, 'd MMM yyyy', { locale: fr })}
                      </Text>
                    </View>
                    <Text style={styles.recentItemAmount}>{Number(tx.amount).toFixed(2)} €</Text>
                  </View>
                ))
              )}
            </View>

          </>
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
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FontSizes.base,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greeting: {
    fontSize: FontSizes.hero,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -1,
  },
  greetingName: {
    fontStyle: 'italic',
    color: Colors.coral,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontWeight: '400',
    color: Colors.muted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.6)',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  kpiSub: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  causesCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  causesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  causeBadge: {
    backgroundColor: Colors.mutedBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  causeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  recentCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  seeAllText: {
    color: Colors.coral,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  emptyRecent: {
    color: Colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedBackground,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentItemIconText: {
    color: Colors.coral,
    fontWeight: '800',
    fontSize: 16,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemName: {
    fontWeight: '800',
    color: Colors.foreground,
    fontSize: 16,
  },
  recentItemDate: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  recentItemAmount: {
    fontWeight: '800',
    color: Colors.coral,
    fontSize: 18,
  },
  paramsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  paramItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  paramLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: '600',
  },
  paramValue: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.foreground,
  },
  paramEdit: {
    padding: 4,
  },
});
