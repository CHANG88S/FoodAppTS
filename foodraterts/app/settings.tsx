import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function SettingsScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.viewer) as any;
  const updateProfileProfile = useAction(api.users.updateProfile);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Visibility toggle states
  const [showEmail, setShowEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const hasMinLength = newPassword.length >= 8;

  useFocusEffect(
    useCallback(() => {
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowEmail(false);
    }, [])
  );

  useEffect(() => {
    if (currentUser) {
      setName((currentUser as any).name || '');
      setUsername((currentUser as any).username || '');
      setEmail((currentUser as any).email || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      if (!username.trim()) {
        return Alert.alert('Error', 'Username cannot be blank.');
      }

      if (newPassword.trim().length > 0) {
        if (!currentPassword.trim()) {
          return Alert.alert('Error', 'Please enter your current password to set a new one.');
        }
        if (!hasMinLength) {
          return Alert.alert('Error', 'Password must be at least 8 characters long.');
        }
      }

      if (updateProfileProfile) {
        await updateProfileProfile({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        });
      }

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile.');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username (Unique)</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter unique username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={showEmail}
            />
            
            {!showEmail && (
              <BlurView intensity={85} tint="light" style={styles.blurOverlay}>
                <Text style={styles.blurPlaceholderText}>••••••••••••••••</Text>
              </BlurView>
            )}

            <TouchableOpacity onPress={() => setShowEmail(!showEmail)} style={styles.eyeIcon}>
              <Ionicons name={showEmail ? "eye-outline" : "eye-off-outline"} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Required only if changing password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeIcon}>
              <Ionicons name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
              <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {newPassword.length > 0 && (
            <View style={styles.constraintsBox}>
              <Text style={[styles.constraintText, hasMinLength ? styles.validText : styles.invalidText]}>
                {hasMinLength ? '✓' : '•'} At least 8 characters long
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  blurOverlay: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 44,
    bottom: 1,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  blurPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 14,
    letterSpacing: 2,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    padding: 4,
    zIndex: 2,
  },
  constraintsBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  constraintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  validText: {
    color: '#059669',
  },
  invalidText: {
    color: '#9CA3AF',
  },
  saveButton: {
    backgroundColor: '#6c3b3b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});