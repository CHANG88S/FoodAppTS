import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsofServiceScreen() {
    const router = useRouter();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const sections = [
        {
            id: 'data-collection',
            title: 'Data We Collect',
            icon: 'database-outline',
            content: [
                '• Account Information: Name, username, email, profile picture',
                '• Reviews & Ratings: Restaurant reviews, menu item ratings, detailed feedback',
                '• Location Data: Restaurant locations, visit history, geographic preferences',
                '• Preferences: Taste preferences (sweetness, ice level, milk base), dietary restrictions',
                '• Social Data: Follows, likes, comments, social interactions',
                '• Usage Data: App interactions, features used, time spent in app'
            ]
        },
        {
            id: 'data-usage',
            title: 'How We Use Your Data',
            icon: 'cog-outline',
            content: [
                '• Service Improvement: Your data helps us improve recommendations and app features',
                '• Personalization: Create a tailored experience based on your preferences',
                '• Safety & Security: Detect fraud, prevent abuse, and protect user accounts',
                '• Communication: Send notifications about activity related to your account',
                '• Research: Develop new features and improve existing ones'
            ]
        },
        {
            id: 'data-sharing',
            title: 'Data Sharing & Third Parties',
            icon: 'people-outline',
            content: [
                '• We never sell your personal data to third parties',
                '• Public Data: Reviews, ratings, and social activity are visible to other users',
                '• Service Providers: We use Convex for hosting and data storage, and Mapbox for map displays and address lookup',
                '• No Ads or Trackers: We do not use third-party advertising, analytics, or tracking services',
                '• Legal Requirements: We may share data when required by law or to protect our rights',
                '• Business Transfers: Data may be transferred if we are acquired or merge with another company',
                '• With Consent: We share data with third parties only when you explicitly consent'
            ]
        },
        {
            id: 'user-rights',
            title: 'Your Rights & Choices',
            icon: 'shield-checkmark-outline',
            content: [
                '• Access: View your data and account information anytime',
                '• Correction: Update or correct your personal information',
                '• Deletion: Delete your account and associated data anytime via Account Settings',
                '• Privacy Settings: Manage data collection preferences in the app',
                '• Control: Manage privacy settings and visibility preferences'
            ]
        },
        {
            id: 'data-security',
            title: 'Data Security & Storage',
            icon: 'lock-closed',
            content: [
                '• Encryption: All data is encrypted in transit and at rest',
                '• Secure Storage: We use industry-standard security measures',
                '• Regular Updates: Security practices are continuously reviewed and updated',
                '• Access Control: Strict access controls limit who can view your data',
                '• Monitoring: We monitor for suspicious activity and potential breaches',
                '• Compliance: We comply with data protection regulations (GDPR, CCPA, etc.)'
            ]
        },
        {
            id: 'cookies-tracking',
            title: 'Tracking & Local Storage',
            icon: 'time-outline',
            content: [
                '• No Cookies: FoodRater is a native app and does not use browser cookies',
                '• Local Storage: Your login token is stored securely on your device using Expo SecureStore',
                '• Push Notifications: If you enable notifications, your device push token is stored to deliver them',
                '• No Ad Tracking: No advertising identifiers or cross-app tracking are used',
                '• No Location Tracking: The app does not access your device location; restaurant locations come from place data',
                '• Device Info: Your platform (iOS or Android) is stored with your notification settings for compatibility'
            ]
        },
        {
            id: 'children-privacy',
            title: 'Children\'s Privacy',
            icon: 'child-outline',
            content: [
                '• Age Requirement: You must be at least 13 years old to create an account; age is confirmed at sign-up',
                '• No Under-13 Accounts: We do not knowingly allow accounts for children under 13',
                '• No Targeting: We do not target children with advertising or features',
                '• Reporting: Built-in reporting and blocking let users flag inappropriate content and behavior',
                '• Moderation: Reports are reviewed by moderators, and content that violates our rules is removed'
            ]
        },
        {
            id: 'updates-notify',
            title: 'Policy Updates & Notifications',
            icon: 'notifications-outline',
            content: [
                '• 30-Day Notice: Major changes are announced 30 days in advance',
                '• In-App Notifications: You\'ll be notified of significant policy changes',
                '• Version History: Previous versions of this policy are available upon request',
                '• Feedback Period: You can provide feedback on proposed changes',
                '• Opt-Out Rights: You may opt out of certain data uses after policy changes',
                '• Continued Use: Using the app after changes constitutes acceptance'
            ]
        }
    ];

    return (
        <SafeAreaView style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.introCard}>
                    <Ionicons name="document-text-outline" size={32} color="#6c3b3b" />
                    <Text style={styles.introTitle}>FoodRater Terms of Service</Text>
                    <Text style={styles.introText}>Last updated: November 2026</Text>
                    <Text style={styles.introDescription}>
                        Welcome to FoodRater! This Terms of Service governs your use of our app and explains how we collect, use, and protect your data. By using FoodRater, you agree to these terms.
                    </Text>
                </View>

                <View style={styles.highlightBox}>
                    <Text style={styles.highlightTitle}>🔍 Key Points</Text>
                    <Text style={styles.highlightText}>• Rate dishes, share reviews, and follow other food lovers</Text>
                    <Text style={styles.highlightText}>• Your data is encrypted and never sold to third parties</Text>
                    <Text style={styles.highlightText}>• No third-party advertising or tracking services are used</Text>
                    <Text style={styles.highlightText}>• You have full control over your data and can delete it anytime</Text>
                </View>

                {sections.map((section) => (
                    <View key={section.id} style={styles.sectionCard}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(section.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name={section.icon as any} size={20} color="#6c3b3b" />
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                            </View>
                            <Ionicons
                                name={expandedSections[section.id] ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>

                        {expandedSections[section.id] && (
                            <View style={styles.sectionContent}>
                                {section.content.map((item, index) => (
                                    <Text key={index} style={styles.contentText}>{item}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.finalCard}>
                    <Text style={styles.finalTitle}>Contact Us</Text>
                    <Text style={styles.finalText}>
                        Questions about these terms or your data? Contact us at:
                    </Text>
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Linking.openURL('mailto:support@foodrater.app')}
                    >
                        <Ionicons name="mail-outline" size={16} color="#6c3b3b" />
                        <Text style={styles.contactText}>support@foodrater.app</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.legalNotice}>
                    <Text style={styles.legalText}>
                        By using FoodRater, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    introCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 12,
        textAlign: 'center',
    },
    introText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        marginBottom: 8,
    },
    introDescription: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
        lineHeight: 20,
    },
    highlightBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FECDD3',
        marginBottom: 16,
    },
    highlightTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9F1239',
        marginBottom: 8,
    },
    highlightText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
        marginBottom: 4,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    sectionContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 0,
        backgroundColor: '#F9FAFB',
    },
    contentText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 6,
    },
    finalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        alignItems: 'center',
    },
    finalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    finalText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECDD3',
    },
    contactText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c3b3b',
    },
    legalNotice: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
    },
    legalText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 16,
    },
});