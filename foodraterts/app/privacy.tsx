import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lastUpdated}>Last Updated: August 2025</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.sectionText}>
          FoodRater collects the following information to provide and improve our service:
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Account Information:</Text> Email address, username, display name, and password (encrypted) required to create an account.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Profile Information:</Text> Optional profile picture, city, taste preferences (sweetness, ice level, milk base, favorite cuisines, dietary restrictions, spice tolerance).</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Content You Create:</Text> Restaurant ratings, menu item reviews, photos (optional), tweets, visit history, and social interactions (follows, likes, comments).</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Usage Data:</Text> App interactions and features used to improve the service.</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.sectionText}>
          We use your information to:
        </Text>
        <Text style={styles.bullet}>• Provide, maintain, and improve the FoodRater service</Text>
        <Text style={styles.bullet}>• Process your reviews, ratings, and social features</Text>
        <Text style={styles.bullet}>• Enable user profiles and social interactions (following, notifications)</Text>
        <Text style={styles.bullet}>• Respond to your requests and customer support</Text>
        <Text style={styles.bullet}>• Detect, prevent, and address technical issues and abuse</Text>

        <Text style={styles.sectionTitle}>3. Data Storage & Third-Party Services</Text>
        <Text style={styles.sectionText}>
          Your data is stored and processed using:
        </Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Convex:</Text> Our backend provider that stores all application data (users, reviews, restaurants, etc.). Data is transmitted securely and stored in compliance with industry standards.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Expo SecureStore:</Text> Stores your authentication token locally on your device.</Text>
        <Text style={styles.bullet}>• No third-party analytics, advertising, or tracking services are used in this app.</Text>

        <Text style={styles.sectionTitle}>4. Information Sharing</Text>
        <Text style={styles.sectionText}>
          We do not sell your personal information. Your content (reviews, ratings, profile, photos) is shared with other users as intended by the app's social features. We may access your data:
        </Text>
        <Text style={styles.bullet}>• To comply with legal obligations</Text>
        <Text style={styles.bullet}>• To protect our rights, privacy, safety, or property</Text>
        <Text style={styles.bullet}>• With your consent</Text>

        <Text style={styles.sectionTitle}>5. Your Rights & Controls</Text>
        <Text style={styles.sectionText}>
          You have the right to:
        </Text>
        <Text style={styles.bullet}>• Access, update, or delete your account and data through the in-app Profile Settings</Text>
        <Text style={styles.bullet}>• Delete your account entirely via Account Settings, which removes all your personal data from our servers</Text>
        <Text style={styles.bullet}>• Opt out of emails or communications by contacting us</Text>

        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.sectionText}>
          We retain your data while your account is active. When you delete your account, your personal information and user-generated content are permanently removed from our servers within a reasonable timeframe.
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.sectionText}>
          FoodRater is not intended for children under 13. We do not knowingly collect data from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.sectionText}>
          We may update this privacy policy from time to time. Significant changes will be notified in-app.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.sectionText}>
          For questions about this policy or your data, contact us at:
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
