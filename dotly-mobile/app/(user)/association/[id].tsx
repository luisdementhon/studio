import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/Button';

export default function AssociationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [assoc, setAssoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    // Fetch association details
    const fetchAssoc = async () => {
      try {
        const snap = await getDoc(doc(db, 'associations', id));
        if (snap.exists()) {
          setAssoc({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.warn("Error fetching association details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssoc();
  }, [id]);

  useEffect(() => {
    if (!user || !id || typeof id !== 'string') return;
    
    // Listen to user's supported associations to update the button live
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsSupported((data.associations || []).includes(id));
      }
    });

    return () => unsubUser();
  }, [user, id]);

  const toggleAssociation = async () => {
    if (!user || !assoc) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        associations: !isSupported ? arrayUnion(assoc.id) : arrayRemove(assoc.id),
        causes: !isSupported ? arrayUnion(assoc.cause || 'autre') : arrayRemove(assoc.cause || 'autre')
      });
    } catch (error) {
      console.warn("Erreur mise à jour asso:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour cette association.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  if (!assoc) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Association introuvable.</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Image or Gradient placeholder */}
        <View style={styles.coverImage}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{assoc.logo || '🏢'}</Text>
          </View>
          <Text style={styles.title}>{assoc.associationName || assoc.name}</Text>
          <Text style={styles.causeText}>{assoc.cause}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button 
            title={isSupported ? "Vous soutenez cette association" : "Soutenir cette association"} 
            onPress={toggleAssociation}
            variant={isSupported ? "outline" : "vibrant"}
            icon={<Ionicons name={isSupported ? "heart" : "heart-outline"} size={20} color={isSupported ? Colors.coral : '#FFF'} style={{marginRight: 8}} />}
            style={styles.mainActionBtn}
            textStyle={isSupported ? { color: Colors.coral } : {}}
          />
          
          {assoc.website && (
            <TouchableOpacity 
              style={styles.webButton}
              onPress={() => Linking.openURL(assoc.website)}
            >
              <Ionicons name="globe-outline" size={24} color={Colors.foreground} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.descriptionText}>{assoc.description || "Aucune description fournie par l'association."}</Text>
        </View>

        {assoc.currentMissions && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Nos Missions</Text>
            <Text style={styles.descriptionText}>{assoc.currentMissions}</Text>
          </View>
        )}

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Informations légales</Text>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={20} color={Colors.muted} />
            <Text style={styles.infoText}>Numéro RNA : <Text style={styles.infoTextBold}>{assoc.rnaNumber || 'Non renseigné'}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.muted} />
            <Text style={styles.infoText}>Contact : <Text style={styles.infoTextBold}>{assoc.email || 'Non renseigné'}</Text></Text>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  coverImage: {
    height: 140,
    backgroundColor: 'rgba(251, 139, 123, 0.1)', // coral tint
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: -40,
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 28,
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  causeText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.coral,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  mainActionBtn: {
    flex: 1,
  },
  webButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  infoText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
  },
  infoTextBold: {
    fontFamily: 'Bricolage-Bold',
    color: Colors.foreground,
  },
  errorText: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.muted,
  },
});
