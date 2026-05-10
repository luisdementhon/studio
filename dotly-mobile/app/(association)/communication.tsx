import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';

export default function CommunicationScreen() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    
    // Simulate API call to send emails
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Succès', 'Votre message a été envoyé à tous vos donateurs !');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Communication.
        </Text>
        <Text style={styles.subtitle}>
          Restez en contact avec vos donateurs.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.coral} />
          <Text style={styles.infoText}>
            En publiant une communication, vos donateurs recevront une notification sur leur application Dotly et pourront suivre votre actualité.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Sujet / Titre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Merci pour votre soutien en 2026 !"
            placeholderTextColor={Colors.muted}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Votre message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Écrivez votre message ici..."
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <Button 
            title="Publier" 
            onPress={handleSend} 
            loading={loading}
            icon={<Ionicons name="send" size={18} color="#FFF" style={{marginRight: 8}} />}
            style={{ marginTop: Spacing.md }}
          />
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique des communications</Text>
          
          <View style={styles.emptyHistory}>
            <Ionicons name="mail-unread-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyText}>Aucune communication envoyée récemment.</Text>
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
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: 'Bricolage-ExtraBold',
    fontSize: 36,
    color: Colors.coral,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.muted,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.coralLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#FFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.foreground,
    marginBottom: Spacing.lg,
  },
  textArea: {
    height: 120,
    paddingTop: Spacing.md, // ensure top alignment on iOS
  },
  historySection: {
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.lg,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  emptyHistory: {
    backgroundColor: '#FFF',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: 'Bricolage',
    fontSize: FontSizes.sm,
    color: Colors.muted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
