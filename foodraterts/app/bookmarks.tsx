import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookmarkButton } from '../components/BookmarkButton';

type BookmarkTab = 'restaurants' | 'reviews' | 'tweets';

export default function BookmarksScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookmarkTab>('restaurants');

  const currentUser = useQuery(api.users.viewer);

  const bookmarkedRestaurants = useQuery(api.bookmarks.listBookmarkedRestaurants) ?? [];
  const bookmarkedReviews = useQuery(api.bookmarks.listBookmarkedReviews) ?? [];
  const bookmarkedTweets = useQuery(api.bookmarks.listBookmarkedTweets) ?? [];

  const bookmarks =
    activeTab === 'restaurants'
      ? bookmarkedRestaurants
      : activeTab === 'reviews'
      ? bookmarkedReviews
      : bookmarkedTweets;

  const isLoading = !bookmarkedRestaurants || !bookmarkedReviews || !bookmarkedTweets;

  const handleRestaurantPress = (restaurantId: string) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  const handleReviewPress = (reviewId: string, activityType: string) => {
    router.push({
      pathname: '/restaurant/post/[reviewId]',
      params: { reviewId, activityType },
    });
  };

  const handleTweetPress = (tweetId: string) => {
    router.push(`/social/${tweetId}`);
  };

  // Guest state
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.guestState}>
          <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
          <Text style={styles.guestTitle}>Sign in to view bookmarks</Text>
          <Text style={styles.guestText}>
            Book your favorite restaurants, reviews, and tweets for easy access.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
          onPress={() => setActiveTab('restaurants')}
        >
          <Text
            style={[styles.tabText, activeTab === 'restaurants' && styles.activeTabText]}
          >
            Restaurants ({bookmarkedRestaurants.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews ({bookmarkedReviews.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tweets' && styles.activeTab]}
          onPress={() => setActiveTab('tweets')}
        >
          <Text style={[styles.tabText, activeTab === 'tweets' && styles.activeTabText]}>
            Tweets ({bookmarkedTweets.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#6c3b3b" />
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyText}>
            Your bookmarked {activeTab === 'restaurants' ? 'restaurants' : activeTab === 'reviews' ? 'reviews' : 'tweets'} will appear here
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'restaurants' &&
            bookmarkedRestaurants.map((item: any) => (
              <TouchableOpacity
                key={item.bookmarkId}
                style={styles.card}
                onPress={() => handleRestaurantPress(item.restaurant._id)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="restaurant" size={20} color="#6c3b3b" />
                    <Text style={styles.cardTitle}>{item.restaurant.restaurantName}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {item.restaurant.city}, {item.restaurant.state}
                  </Text>
                  {item.restaurant.category && (
                    <Text style={styles.cardCategory}>{item.restaurant.category}</Text>
                  )}
                </View>
                <BookmarkButton targetType="restaurant" targetId={item.restaurant._id} size={20} />
              </TouchableOpacity>
            ))}

          {activeTab === 'reviews' &&
            bookmarkedReviews.map((item: any) => (
              <TouchableOpacity
                key={item.bookmarkId}
                style={styles.card}
                onPress={() => handleReviewPress(item.reviewId, item.activityType)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="star" size={20} color="#6c3b3b" />
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      Rated {item.itemName} from {item.restaurantName}
                    </Text>
                  </View>
                  <Text style={styles.cardSubtitle}>by {item.authorHandle}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.overallRating}</Text>
                  </View>
                  {item.notes && (
                    <Text style={styles.notesText} numberOfLines={2}>
                      {item.notes}
                    </Text>
                  )}
                </View>
                <BookmarkButton targetType="review" targetId={item.reviewId} size={20} />
              </TouchableOpacity>
            ))}

          {activeTab === 'tweets' &&
            bookmarkedTweets.map((item: any) => (
              <TouchableOpacity
                key={item.bookmarkId}
                style={styles.card}
                onPress={() => handleTweetPress(item.tweet._id)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="chatbubble" size={20} color="#6c3b3b" />
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      by {item.tweet.authorHandle}
                    </Text>
                  </View>
                  <Text style={styles.tweetBody} numberOfLines={3}>
                    {item.tweet.body}
                  </Text>
                </View>
                <BookmarkButton targetType="tweet" targetId={item.tweet._id} size={20} />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
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
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6c3b3b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  guestState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  signInButton: {
    backgroundColor: '#6c3b3b',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardCategory: {
    fontSize: 12,
    color: '#6c3b3b',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tweetBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});