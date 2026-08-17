import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Switch,
    Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function DataCollectionScreen() {
    const router = useRouter();
    const trackEvent = useMutation(api.analytics.trackEvent);

    const [dataSettings, setDataSettings] = useState({
        analyticsEnabled: true,
        personalizationEnabled: true,
        aiRecommendationsEnabled: true,
        crashReportingEnabled: true,
        performanceMonitoringEnabled: true,
    });

    const handleSettingChange = (key: string, value: boolean) => {
        setDataSettings(prev => ({ ...prev, [key]: value }));

        // Track consent changes
        trackEvent({
            eventType: "privacy_consent_changed",
            properties: {
                setting: key,
                enabled: value,
            },
            metadata: {
                screen: "data_collection",
            },
        });
    };

    const handleResetAll = () => {
        Alert.alert(
            "Reset All Data",
            "This will reset all your data collection preferences to default values. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                        setDataSettings({
                            analyticsEnabled: true,
                            personalizationEnabled: true,
                            aiRecommendationsEnabled: true,
                            crashReportingEnabled: true,
                            performanceMonitoringEnabled: true,
                        });
                        Alert.alert("Reset Complete", "Your data collection preferences have been reset to defaults.");
                    },
                },
            ]
        );
    };

    const dataCategories = [
        {
            title: 'Essential Data',
            icon: 'lock-closed',
            description: 'Required for app functionality',
            items: [
                { name: 'Account credentials', required: true },
                { name: 'Profile information', required: true },
                { name: 'Restaurant reviews', required: true },
                { name: 'Authentication tokens', required: true },
            ],
        },
        {
            title: 'Analytics & Performance',
            icon: 'stats-chart-outline',
            description: 'Helps us improve the app',
            settingKey: 'analyticsEnabled',
            items: [
                { name: 'App usage patterns', required: false },
                { name: 'Feature interactions', required: false },
                { name: 'Performance metrics', required: false },
                { name: 'Crash reports', required: false },
            ],
        },
        {
            title: 'Personalization',
            icon: 'person-outline',
            description: 'Enhances your experience',
            settingKey: 'personalizationEnabled',
            items: [
                { name: 'Taste preferences', required: false },
                { name: 'Restaurant recommendations', required: false },
                { name: 'Location-based suggestions', required: false },
                { name: 'Social connections', required: false },
            ],
        },
        {
            title: 'AI Features',
            icon: 'bulb-outline',
            description: 'Powered by machine learning',
            settingKey: 'aiRecommendationsEnabled',
            items: [
                { name: 'Recommendation algorithms', required: false },
                { name: 'Taste pattern analysis', required: false },
                { name: 'Search optimization', required: false },
                { name: 'Content moderation', required: false },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Data Collection Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.introCard}>
                    <Ionicons name="shield-checkmark" size={32} color="#6c3b3b" />
                    <Text style={styles.introTitle}>Control Your Data</Text>
                    <Text style={styles.introText}>
                        Manage how we collect and use your data to improve FoodRater. You can change these settings anytime.
                    </Text>
                </View>

                {dataCategories.map((category, categoryIndex) => {
                    const settingKey = category.settingKey as keyof typeof dataSettings;
                    const isEnabled = settingKey ? dataSettings[settingKey] : true;

                    return (
                        <View key={categoryIndex} style={styles.categoryCard}>
                            <View style={styles.categoryHeader}>
                                <View style={styles.categoryTitleRow}>
                                    <Ionicons name={category.icon as any} size={20} color="#6c3b3b" />
                                    <View style={styles.categoryTitleColumn}>
                                        <Text style={styles.categoryTitle}>{category.title}</Text>
                                        <Text style={styles.categoryDescription}>{category.description}</Text>
                                    </View>
                                </View>
                                {category.settingKey && (
                                    <Switch
                                        value={isEnabled}
                                        onValueChange={(value) => handleSettingChange(category.settingKey!, value)}
                                        trackColor={{ false: '#D1D5DB', true: '#6c3b3b' }}
                                        thumbColor={isEnabled ? '#FFFFFF' : '#F3F4F6'}
                                    />
                                )}
                            </View>

                            <View style={styles.itemsList}>
                                {category.items.map((item, itemIndex) => (
                                    <View key={itemIndex} style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemStatus}>
                                                {item.required ? 'Required' : 'Optional'}
                                            </Text>
                                        </View>
                                        {item.required ? (
                                            <Ionicons name="lock-closed" size={14} color="#6c3b3b" />
                                        ) : (
                                            <Ionicons name="lock-open-outline" size={14} color="#9CA3AF" />
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>📊 What We Do With Your Data</Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Improve Features:</Text> Your feedback helps us build better features
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Personalize Experience:</Text> Get recommendations that match your taste
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Enhance Performance:</Text> Make the app faster and more reliable
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Ensure Safety:</Text> Protect our community from abuse
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>🔒 Your Privacy Rights</Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Access:</Text> View what data we have about you
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Delete:</Text> Request removal of your data
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Export:</Text> Download your data in a portable format
                    </Text>
                    <Text style={styles.infoText}>
                        • <Text style={styles.boldText}>Opt-out:</Text> Disable personalized features anytime
                    </Text>
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={handleResetAll}>
                    <Ionicons name="refresh-outline" size={16} color="#6c3b3b" />
                    <Text style={styles.resetButtonText}>Reset to Defaults</Text>
                </TouchableOpacity>

                <View style={styles.footerNote}>
                    <Text style={styles.footerText}>
                        Changes take effect immediately. Some features may be limited if you disable data collection.
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
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    categoryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    categoryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    categoryTitleColumn: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    categoryDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    itemsList: {
        padding: 12,
        gap: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
        color: '#374151',
        marginBottom: 2,
    },
    itemStatus: {
        fontSize: 11,
        color: '#6B7280',
    },
    infoCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
        marginBottom: 6,
    },
    boldText: {
        fontWeight: '600',
        color: '#1F2937',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c3b3b',
    },
    footerNote: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    footerText: {
        fontSize: 11,
        color: '#92400E',
        textAlign: 'center',
        lineHeight: 16,
    },
});