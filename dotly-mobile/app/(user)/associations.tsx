import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

interface Association {
  id: string;
  name: string;
  description: string;
  logo: string;
  cause: string;
  website: string;
}

const causeLabels: Record<string, string> = {
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

export default function AssociationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [userAssociations, setUserAssociations] = useState<string[]>([]);
  const [allAssociations, setAllAssociations] = useState<Association[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCause, setFilterCause] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // Le site utilise l'attribut "associations" et parfois "causes" (dans le dash). On va cibler "associations" et "causes" (causes générales)
        setUserAssociations(data.associations || []);
      }
    });

    const assocRef = collection(db, "associations");
    const unsubAssoc = onSnapshot(assocRef, (snap) => {
      const assocs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.associationName || data.name || "Association",
          description: data.description || "",
          logo: data.logo || "🏢",
          cause: data.cause || "autre",
          website: data.website || "",
        };
      });
      setAllAssociations(assocs);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubAssoc();
    };
  }, [user]);

  const toggleAssociation = async (assoc: Association, isAdding: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        associations: isAdding ? arrayUnion(assoc.id) : arrayRemove(assoc.id),
        // On synchronise les "causes" aussi si c'est nouveau
        causes: isAdding ? arrayUnion(assoc.cause) : arrayRemove(assoc.cause)
      });
    } catch (error) {
      console.warn("Erreur mise à jour asso:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour vos associations.");
    }
  };

  const causes = Array.from(new Set(allAssociations.map(a => a.cause).filter(Boolean)));

  const filteredAssociations = allAssociations.filter(assoc => {
    const name = assoc.name || "";
    const desc = assoc.description || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterCause || assoc.cause === filterCause;
    return matchesSearch && matchesFilter;
  });

  const myAssocs = allAssociations.filter(a => userAssociations.includes(a.id));

  const renderCard = (assoc: Association, isSupported: boolean) => (
    <TouchableOpacity 
      key={assoc.id} 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/(user)/association/${assoc.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLogo}>
          <Text style={styles.cardLogoText}>{assoc.logo}</Text>
        </View>
        <View style={styles.causeBadge}>
          <Text style={styles.causeBadgeText}>{causeLabels[assoc.cause] || assoc.cause}</Text>
        </View>
      </View>
      
      <Text style={styles.cardTitle}>{assoc.name}</Text>
      <Text style={styles.cardDescription} numberOfLines={3}>
        {assoc.description}
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.btnSupport, isSupported ? styles.btnSupported : null]}
          onPress={() => toggleAssociation(assoc, !isSupported)}
        >
          <Ionicons name={isSupported ? "checkmark" : "add"} size={18} color={isSupported ? Colors.mint : '#fff'} />
          <Text style={[styles.btnSupportText, isSupported ? {color: Colors.mint} : null]}>
            {isSupported ? 'Soutenue' : 'Soutenir'}
          </Text>
        </TouchableOpacity>
        
        {assoc.website ? (
          <TouchableOpacity 
            style={styles.btnLink}
            onPress={() => Linking.openURL(assoc.website)}
          >
            <Ionicons name="open-outline" size={20} color={Colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>
          Les{'\n'}
          <Text style={styles.titleAccent}>Assos.</Text>
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mes Associations */}
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="heart" size={20} color={Colors.coral} />
            </View>
            <Text style={styles.sectionTitle}>Mes Associations ({myAssocs.length})</Text>
          </View>

          {myAssocs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="business-outline" size={40} color={Colors.muted} style={{marginBottom: 10}} />
              <Text style={styles.emptyText}>Vous ne soutenez aucune association pour le moment.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {myAssocs.map(a => renderCard(a, true))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Catalogue */}
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, {backgroundColor: Colors.mintLight}]}>
              <Ionicons name="search" size={20} color={Colors.mint} />
            </View>
            <Text style={styles.sectionTitle}>Catalogue</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.muted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Rechercher une asso..."
              placeholderTextColor={Colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <TouchableOpacity 
              style={[styles.filterBadge, filterCause === null ? styles.filterBadgeActive : null]}
              onPress={() => setFilterCause(null)}
            >
              <Text style={[styles.filterText, filterCause === null ? styles.filterTextActive : null]}>Toutes</Text>
            </TouchableOpacity>
            {causes.map(c => (
              <TouchableOpacity 
                key={c}
                style={[styles.filterBadge, filterCause === c ? styles.filterBadgeActive : null]}
                onPress={() => setFilterCause(c)}
              >
                <Text style={[styles.filterText, filterCause === c ? styles.filterTextActive : null]}>
                  {causeLabels[c] || c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.grid, { marginTop: 16 }]}>
            {filteredAssociations.map(a => renderCard(a, userAssociations.includes(a.id)))}
            {filteredAssociations.length === 0 && (
              <Text style={styles.emptyText}>Aucun résultat pour votre recherche.</Text>
            )}
          </View>

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
    paddingBottom: 0,
  },
  title: {
    fontSize: FontSizes.hero,
    fontWeight: '800',
    color: Colors.foreground,
    letterSpacing: -1,
    lineHeight: 42,
  },
  titleAccent: {
    fontStyle: 'italic',
    color: Colors.coral,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.foreground,
  },
  emptyBox: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    textAlign: 'center',
    fontSize: FontSizes.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.mutedBackground,
    marginVertical: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.foreground,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.mutedBackground,
    marginRight: 8,
  },
  filterBadgeActive: {
    backgroundColor: Colors.foreground,
    borderColor: Colors.foreground,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.muted,
  },
  filterTextActive: {
    color: '#fff',
  },
  grid: {
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoText: {
    fontSize: 24,
  },
  causeBadge: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  causeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: FontSizes.sm,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnSupport: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.coral,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSupported: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.mint,
  },
  btnSupportText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.base,
  },
  btnLink: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
