import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AppStatisticsScreen() {
  const router = useRouter();

  const currentUser = useQuery(api.users.viewer);
  const appStats = useQuery(api.geocoding.getAppStatistics);

  // 🔑 Admin Guard: Check the user's role property (owner or developer only)
  useEffect(() => {
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== 'owner' && currentUser.role !== 'developer') {
        Alert.alert("Access Denied", "You do not have administrative privileges to view this page.");
        router.replace('/(tabs)/home');
      }
    }
  }, [currentUser]);

  // Show loading spinner while checking auth state
  if (currentUser === undefined) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#6c3b3b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Statistics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>

          {appStats ? (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="restaurant-outline" size={28} color="#6c3b3b" style={styles.statIcon} />
                <Text style={styles.statNumber}>{appStats.totalRestaurants}</Text>
                <Text style={styles.statLabel}>Total Restaurants</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="star-outline" size={28} color="#F59E0B" style={styles.statIcon} />
                <Text style={styles.statNumber}>{appStats.totalReviews}</Text>
                <Text style={styles.statLabel}>Total Reviews</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={28} color="#10B981" style={styles.statIcon} />
                <Text style={styles.statNumber}>{appStats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#6c3b3b" />
          )}
        </View>

        {/* Additional Stats Section */}
        {appStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Metrics</Text>

            <View style={styles.detailStatsGrid}>
              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="list-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Menu Items</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalMenuItems}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Social Posts</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalTweets}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Conversations</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalConversations}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Messages</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalMessages}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="person-add-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Follows</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalFollows}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="notifications-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Notifications</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalNotifications}</Text>
              </View>

              <View style={styles.detailStatCard}>
                <View style={styles.detailStatRow}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailStatLabel}>Check-ins</Text>
                </View>
                <Text style={styles.detailStatNumber}>{appStats.totalVisits}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            📊 Real-time application metrics and user activity data
          </Text>
          <Text style={styles.infoText}>
            🔄 Data updates automatically when you navigate to this page
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  detailStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailStatCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  detailStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 26,
  },
  infoSection: {
    gap: 8,
    paddingTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
});