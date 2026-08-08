import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@foodrater.app').catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={32} color="#6c3b3b" />
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            We're here to assist you. Reach out with questions, issues, or feedback.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I rate a menu item?</Text>
          <Text style={styles.faqAnswer}>
            Navigate to a restaurant, tap "RATE ★" on any menu item, and submit your review with ratings and notes.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I delete my account?</Text>
          <Text style={styles.faqAnswer}>
            Open the drawer (top-right menu), go to Account Settings, and tap "Delete Account". This permanently removes all your data.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Can I edit or delete my reviews?</Text>
          <Text style={styles.faqAnswer}>
            Yes! Go to Profile → REVIEWS tab, find your review, and tap to edit or delete. Changes sync immediately.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I suggest a new place or menu item?</Text>
          <Text style={styles.faqAnswer}>
            Tap "Suggest a Place" from the drawer or Search screen to submit a restaurant. On any restaurant page, tap "Add Item" to suggest a menu item. Suggestions are reviewed before being added.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>What are badges and how do I get them?</Text>
          <Text style={styles.faqAnswer}>
            Badges are achievements for exploring and rating. View available badges from the drawer ("Badges & Achievements"). Unlock them by using the app!
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I change my preferences?</Text>
          <Text style={styles.faqAnswer}>
            Open the drawer and tap "Boba Preferences" to adjust your taste profile (sweetness, ice, milk base, etc.). This helps personalize your experience.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Is my data private?</Text>
          <Text style={styles.faqAnswer}>
            Your profile and reviews are visible to other users per the app's social model. You control what you post. See our Privacy Policy for details on data handling.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I log out?</Text>
          <Text style={styles.faqAnswer}>
            Open the drawer and tap "Sign Out" at the bottom. You can return anytime by logging back in.
          </Text>
        </View>

        <Text style={styles.footerNote}>
          Have a suggestion or found a bug? We'd love to hear from you!
        </Text>

        <Text style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  contactText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  contactButton: {
    backgroundColor: '#6c3b3b',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  footerSpacer: {
    height: 20,
  },
});
