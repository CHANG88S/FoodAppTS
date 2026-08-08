import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: August 2025</Text>

        <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
        <Text style={styles.sectionText}>
          By accessing or using FoodRater, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.sectionText}>
          FoodRater is a restaurant rating and review app that allows users to:
        </Text>
        <Text style={styles.bullet}>• Browse and discover restaurants and menu items</Text>
        <Text style={styles.bullet}>• Rate and review menu items with detailed attributes</Text>
        <Text style={styles.bullet}>• Share reviews, photos, and opinions socially</Text>
        <Text style={styles.bullet}>• Follow other users and engage with their content</Text>
        <Text style={styles.bullet}>• Suggest new restaurants or menu items for community review</Text>

        <Text style={styles.sectionTitle}>3. User Accounts & Responsibilities</Text>
        <Text style={styles.sectionText}>
          To use FoodRater, you must create an account and provide accurate information. You are responsible for:
        </Text>
        <Text style={styles.bullet}>• Maintaining the confidentiality of your password</Text>
        <Text style={styles.bullet}>• All activity that occurs under your account</Text>
        <Text style={styles.bullet}>• Notifying us immediately of any unauthorized use</Text>
        <Text style={styles.bullet}>• Content you post (reviews, photos, comments, tweets)</Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use Policy</Text>
        <Text style={styles.sectionText}>
          You agree NOT to:
        </Text>
        <Text style={styles.bullet}>• Post false, misleading, or defamatory content</Text>
        <Text style={styles.bullet}>• Impersonate any person or entity</Text>
        <Text style={styles.bullet}>• Harass, abuse, or harm other users</Text>
        <Text style={styles.bullet}>• Post spam or promotional content</Text>
        <Text style={styles.bullet}>• Violate any local, state, national, or international law</Text>
        <Text style={styles.bullet}>• Attempt to gain unauthorized access to our systems</Text>
        <Text style={styles.bullet}>• Use the app for any illegal or unauthorized purpose</Text>

        <Text style={styles.sectionTitle}>5. Content & Intellectual Property</Text>
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>Your Content:</Text> By posting reviews, photos, or other content, you grant us a license to display and distribute it within the app. You retain ownership of content you create.
        </Text>
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>Our Content:</Text> The app design, features, and branding are owned by FoodRater and protected by intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>6. Suggestions & Moderation</Text>
        <Text style={styles.sectionText}>
          User-suggested restaurants and menu items are subject to moderation before being added to the public database. We reserve the right to approve, reject, or edit any suggestion at our discretion.
        </Text>

        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.sectionText}>
          We may suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion. You may delete your account at any time through Account Settings.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimers</Text>
        <Text style={styles.sectionText}>
          FoodRater is provided "as is" without warranties of any kind. We do not guarantee:
        </Text>
        <Text style={styles.bullet}>• Uninterrupted or error-free operation</Text>
        <Text style={styles.bullet}>• Accuracy of restaurant information or user-generated content</Text>
        <Text style={styles.bullet}>• That defects will be corrected</Text>
        <Text style={styles.bullet}>• The app will meet your specific requirements</Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.sectionText}>
          To the fullest extent permitted by law, FoodRater shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.
        </Text>

        <Text style={styles.sectionTitle}>10. Governing Law</Text>
        <Text style={styles.sectionText}>
          These terms are governed by the laws of the jurisdiction in which FoodRater operates. Any disputes shall be resolved in accordance with applicable law.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.sectionText}>
          We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.sectionText}>
          For questions about these terms, contact us at:
        </Text>
        <Text style={styles.contactEmail}>support@foodrater.app</Text>

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
  lastUpdated: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  contactEmail: {
    fontSize: 14,
    color: '#6c3b3b',
    fontWeight: '700',
    marginTop: 4,
  },
  footerSpacer: {
    height: 20,
  },
});
