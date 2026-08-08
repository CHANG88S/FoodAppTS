import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLOR_OPTIONS = [
    { name: 'No Theme', value: '#FFFFFF' },
    { name: 'Classic Milk Tea', value: '#D4A574' },
    { name: 'Oolong Milk Tea', value: '#E2C097' },
    { name: 'Jasmine Milk Tea', value: '#E8DCC8' },
    { name: 'Matcha Latte', value: '#A8C69F' },
    { name: 'Thai Tea', value: '#FF9966' },
    { name: 'Taro Milk Tea', value: '#d9bffd' },
];

const SWEETNESS_OPTIONS = [
    { value: 0, label: '0' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 75, label: '75' },
    { value: 100, label: '100' },
];

const ICE_OPTIONS = [
    { value: 0, label: '0' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 75, label: '75' },
    { value: 100, label: '100' },
];

export default function BobaPreferencesScreen() {
    const router = useRouter();
    const currentUser = useQuery(api.users.viewer);
    const updatePreferences = useMutation(api.users.updatePreferences);

    const [sweetness, setSweetness] = useState(50);
    const [iceLevel, setIceLevel] = useState(50);
    const [milkBase, setMilkBase] = useState('Oat Milk');
    const [favoriteColor, setFavoriteColor] = useState('#6c3b3b');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.preferences) {
            const prefs = currentUser.preferences;
            if (prefs.sweetness !== undefined) setSweetness(prefs.sweetness);
            if (prefs.iceLevel !== undefined) setIceLevel(prefs.iceLevel);
            if (prefs.milkBase) setMilkBase(prefs.milkBase);
            if (prefs.favoriteColor) setFavoriteColor(prefs.favoriteColor);
        }
    }, [currentUser]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updatePreferences({
                sweetness,
                iceLevel,
                milkBase,
                favoriteColor,
            });
            Alert.alert('Success', 'Your boba preferences have been saved!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save preferences.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Boba Preferences</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>My Taste Profile</Text>
                    <Text style={styles.cardSubtitle}>
                        Customize your default boba drink settings
                    </Text>

                    {/* Sweetness */}
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>🍯 Sweetness</Text>
                        <View style={styles.optionRow}>
                            {SWEETNESS_OPTIONS.map((option) => {
                                const isSelected = sweetness === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            isSelected ? styles.optionSelected : styles.optionUnselected
                                        ]}
                                        onPress={() => setSweetness(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            isSelected ? styles.optionSelectedText : styles.optionUnselectedText
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Ice Level */}
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>❄️ Ice Level</Text>
                        <View style={styles.optionRow}>
                            {ICE_OPTIONS.map((option) => {
                                const isSelected = iceLevel === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            isSelected ? styles.optionSelected : styles.optionUnselected
                                        ]}
                                        onPress={() => setIceLevel(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            isSelected ? styles.optionSelectedText : styles.optionUnselectedText
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Milk Base */}
                    <View style={styles.prefRow}>
                        <Text style={styles.prefLabel}>🥛 Preferred Milk Base</Text>
                        <View style={styles.milkToggleRow}>
                            {['Whole Milk', 'Oat Milk', 'Almond Milk'].map((milk) => {
                                const isSelected = milkBase === milk;
                                return (
                                    <TouchableOpacity
                                        key={milk}
                                        style={[
                                            styles.milkOptionButton,
                                            isSelected ? styles.milkSelected : styles.milkUnselected
                                        ]}
                                        onPress={() => setMilkBase(milk)}
                                    >
                                        <Text style={[
                                            styles.milkOptionText,
                                            isSelected ? styles.milkSelectedText : styles.textDark
                                        ]}>
                                            {milk.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Color/Theme Customization */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>App Theme Color</Text>
                    <Text style={styles.cardSubtitle}>
                        Pick your favorite color to personalize your app experience
                    </Text>

                    <View style={styles.colorGrid}>
                        {COLOR_OPTIONS.map((color) => {
                            const isSelected = favoriteColor === color.value;
                            return (
                                <TouchableOpacity
                                    key={color.value}
                                    style={[
                                        styles.colorOption,
                                        isSelected && {
                                            borderColor: color.value === '#FFFFFF' ? '#9CA3AF' : color.value,
                                            backgroundColor: color.value === '#FFFFFF' ? '#F3F4F6' : color.value + '15',
                                            shadowColor: color.value,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 4,
                                            elevation: 2,
                                        }
                                    ]}
                                    onPress={() => setFavoriteColor(color.value)}
                                >
                                    <View style={[styles.colorSwatch, { backgroundColor: color.value }]} />
                                    <Text style={[
                                        styles.colorName,
                                        isSelected && { color: color.value === '#FFFFFF' ? '#1F2937' : color.value, fontWeight: '700' }
                                    ]}>
                                        {color.name}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={20} color={color.value === '#FFFFFF' ? '#374151' : color.value} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Preview */}
                    <View style={styles.previewSection}>
                        <Text style={styles.previewLabel}>Preview with your color:</Text>
                        <View style={[styles.previewRectangle, { backgroundColor: favoriteColor, borderColor: favoriteColor === '#FFFFFF' ? '#E5E7EB' : '#000000' }]} />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </Text>
                </TouchableOpacity>
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
    content: {
        padding: 16,
        gap: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    prefRow: {
        gap: 12,
    },
    prefLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        minWidth: 60,
        alignItems: 'center',
    },
    optionSelected: {
        backgroundColor: '#6c3b3b',
        borderColor: '#6c3b3b',
    },
    optionUnselected: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    optionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    optionSelectedText: {
        color: '#FFFFFF',
    },
    optionUnselectedText: {
        color: '#4B5563',
    },
    milkToggleRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    milkOptionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    milkSelected: {
        backgroundColor: '#6c3b3b',
        borderColor: '#6c3b3b',
    },
    milkUnselected: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    milkOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    milkSelectedText: {
        color: '#FFFFFF',
    },
    textDark: {
        color: '#4B5563',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    colorSwatch: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    previewSection: {
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    previewLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    previewRectangle: {
        height: 100,
        borderRadius: 16,
        borderWidth: 2,
        alignSelf: 'stretch',
    },
    saveButton: {
        backgroundColor: '#6c3b3b',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});