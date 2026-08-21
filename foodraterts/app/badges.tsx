import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BadgesScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.viewer) as any;
  const userReviews = useQuery(api.items.getUserReviews) || [];
  const setBadgeMutation = useMutation(api.users.setDisplayedBadge);

  const hasRatedAtLeastOne = userReviews.length > 0;

  const badgesList = [
    {
      id: 'first-review',
      title: 'First Review',
      icon: '🌟',
      description: 'Rate your very first restaurant or menu item.',
      unlocked: hasRatedAtLeastOne,
    },
  ];

  const handleToggleEquipBadge = async (badge: typeof badgesList[0]) => {
    if (!badge.unlocked) {
      return Alert.alert('Locked', 'You have not unlocked this badge yet!');
    }
    const isCurrentlyEquipped = currentUser?.displayedBadge === badge.title;
    const newBadgeValue = isCurrentlyEquipped ? undefined : badge.title;

    try {
      await setBadgeMutation({ badgeTitle: newBadgeValue });
      Alert.alert('Success', isCurrentlyEquipped ? 'Badge removed from profile.' : `Equipped "${badge.title}" badge!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update badge.');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements & Badges</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionSubtitle}>Unlock badges by exploring and rating spots, then showcase them on your profile!</Text>
        
        {badgesList.map((badge) => {
          const isEquipped = currentUser?.displayedBadge === badge.title;

          return (
            <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.lockedCard]}>
              <Text style={styles.badgeEmoji}>{badge.icon}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
                <Text style={[styles.statusText, badge.unlocked ? styles.unlockedText : styles.lockedText]}>
                  {badge.unlocked ? '✅ Unlocked' : '🔒 Locked'}
                </Text>
              </View>
              {badge.unlocked && (
                <TouchableOpacity 
                  style={[styles.equipButton, isEquipped && styles.unequipButton]}
                  onPress={() => handleToggleEquipBadge(badge)}
                >
                  <Text style={styles.equipButtonText}>{isEquipped ? 'Unequip' : 'Equip'}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14,
  },
  lockedCard: {
    opacity: 0.6,
    backgroundColor: '#F3F4F6',
  },
  badgeEmoji: {
    fontSize: 36,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  badgeDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  unlockedText: {
    color: '#059669',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  equipButton: {
    backgroundColor: '#6c3b3b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unequipButton: {
    backgroundColor: '#4B5563',
  },
  equipButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});