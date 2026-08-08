import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSettingsScreen() {
    const router = useRouter();
    const { signOut } = useAuthActions();
    const deleteAccountMutation = useMutation(api.users.deleteAccount);

    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTextInput, setDeleteTextInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteTextInput !== 'delete') {
            Alert.alert('Error', 'Please type "delete" to confirm.');
            return;
        }

        try {
            setIsDeleting(true);
            await deleteAccountMutation();

            // Sign out after successful deletion
            await signOut();
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete account.');
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Settings</Text>
                <View style={{ width: 22 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Account Actions</Text>
                    <Text style={styles.sectionSubtitle}>
                        Manage your account data and access
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeleteModalVisible(true)}
                >
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>

                <View style={styles.warningBox}>
                    <Ionicons name="warning-outline" size={24} color="#F59E0B" />
                    <View style={styles.warningContent}>
                        <Text style={styles.warningTitle}>Warning</Text>
                        <Text style={styles.warningText}>
                            Deleting your account is permanent. All your reviews, tweets,
                            followers, and following relationships will be removed.
                            This action cannot be undone.
                        </Text>
                    </View>
                </View>
            </View>

            <Modal
                visible={isDeleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="trash" size={28} color="#DC2626" />
                            <Text style={styles.modalTitle}>Delete Account?</Text>
                        </View>

                        <Text style={styles.modalMessage}>
                            This action is permanent and cannot be undone. All your data
                            will be permanently deleted.
                        </Text>

                        <View style={styles.confirmSection}>
                            <Text style={styles.confirmLabel}>
                                Type <Text style={styles.confirmHighlight}>&ldquo;delete&rdquo;</Text> to confirm:
                            </Text>
                            <TextInput
                                style={styles.confirmInput}
                                value={deleteTextInput}
                                onChangeText={setDeleteTextInput}
                                placeholder="Type 'delete'"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setDeleteTextInput('');
                                }}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.deleteConfirmButton,
                                    isDeleting && styles.buttonDisabled
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={isDeleting || deleteTextInput !== 'delete'}
                            >
                                <Text style={styles.deleteConfirmButtonText}>
                                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#DC2626',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#DC2626',
    },
    warningBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FCD34D',
        borderRadius: 12,
        padding: 16,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    confirmSection: {
        marginBottom: 20,
    },
    confirmLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    confirmHighlight: {
        color: '#DC2626',
        fontWeight: '700',
    },
    confirmInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1F2937',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    deleteConfirmButton: {
        backgroundColor: '#DC2626',
    },
    deleteConfirmButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
