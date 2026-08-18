import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatCount } from "../../utils/formatters";
import { ReportButton } from "../../components/ReportButton";
import { BookmarkButton } from "../../components/BookmarkButton";

// Conditionally import Mapbox to avoid crashes when native module isn't available
let Mapbox: any = null;
let MapView: any = null;
let Camera: any = null;
let PointAnnotation: any = null;

try {
  const mapboxModule = require('@rnmapbox/maps');
  Mapbox = mapboxModule.default;
  MapView = mapboxModule.MapView;
  Camera = mapboxModule.Camera;
  PointAnnotation = mapboxModule.PointAnnotation;
} catch (error) {
  console.warn('Mapbox not available:', error);
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TABS = ["ACTIVITY", "TWEETS", "REVIEWS", "PREFERENCES"];

export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams();

  const viewer = useQuery(api.users.viewer);
  const currentUserId = viewer?._id;

  const userProfile = useQuery(api.users.getUserByUsername, {
    username: username as string,
  });

  // Resolve stored profile picture (Convex storage id) to a display URL
  const profilePictureUrl = useQuery(
    api.images.getPublicUrl,
    userProfile?.profilePicture ? { storageId: userProfile.profilePicture } : "skip"
  );

  const targetUserId = userProfile?._id;

  const followers = useQuery(
    api.users.getFollowers,
    targetUserId ? { userId: targetUserId } : "skip"
  );
  const following = useQuery(
    api.users.getFollowing,
    targetUserId ? { userId: targetUserId } : "skip"
  );
  
  const userTweets = useQuery(
    api.tweets?.getTweetsByUserId, 
    targetUserId ? { userId: targetUserId } : "skip"
  ) || [];

  const userReviews = useQuery(
    api.items?.getUserReviewsByUserId,
    targetUserId ? { userId: targetUserId } : "skip"
  ) || [];

  // Batch-resolve review images
  const userReviewImageIds = [...new Set(userReviews.map((r: any) => r.imageStorageId).filter(Boolean))];
  const userReviewImageUrls = useQuery(
    api.images.getPublicUrls,
    userReviewImageIds.length ? { storageIds: userReviewImageIds } : "skip"
  ) || {};

  const isFollowing = useQuery(
    api.users.isFollowing,
    targetUserId ? { followingId: targetUserId } : "skip"
  );

  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);
  const startConversationMutation = useMutation(api.messaging.startConversation);

  const [activeTab, setActiveTab] = useState("ACTIVITY");
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);

  // Map/List View Toggle for Reviews tab
  const [reviewsViewMode, setReviewsViewMode] = useState<'list' | 'map'>('list');

  // Selected review modal popup state for map pins
  const [selectedPinReview, setSelectedPinReview] = useState<any | null>(null);

  // Unified Location Filter States for Reviews tab
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [expandedStateInMenu, setExpandedStateInMenu] = useState<string | null>(null);

  const toggleRestaurantDropdown = (restaurantName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRestaurant(prev => (prev === restaurantName ? null : restaurantName));
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      setAuthModalVisible(true);
      return;
    }
    if (!targetUserId) return;
    try {
      if (isFollowing) {
        await unfollowUser({ followingId: targetUserId });
      } else {
        await followUser({ followingId: targetUserId });
      }
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleMessage = async () => {
    if (!currentUserId) {
      setAuthModalVisible(true);
      return;
    }
    if (!targetUserId) return;

    try {
      const conversationId = await startConversationMutation({
        otherUserId: targetUserId
      });

      router.push({
        pathname: '/messages/[conversationId]' as any,
        params: {
          conversationId: conversationId,
          otherUserId: targetUserId
        }
      } as any);
    } catch (error) {
      console.error("Message navigation error:", error);
    }
  };

  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const profileImageUri = profilePictureUrl ?? undefined;
  const userHandle = userProfile?.username ? `@${userProfile.username}` : "@user";
  const userFullName = userProfile?.name || null;

  // Taste preferences from profile schema
  const userPreferences = userProfile?.preferences || {};
  const sweetnessPref = userPreferences.sweetness ?? 50;
  const icePref = userPreferences.iceLevel ?? 50;
  const milkPref = userPreferences.milkBase ?? 'Oat Milk';
  const themeColor = userPreferences.favoriteColor || '#6c3b3b';

  const getSweetnessLabel = (val: number) => {
    if (val === 0) return 'No Sweetness';
    if (val === 25) return 'Light';
    if (val === 50) return 'Half';
    if (val === 75) return 'Less';
    if (val === 100) return 'Regular';
    if (val === 125) return 'Extra';
    return 'Half';
  };

  const getIceLabel = (val: number) => {
    if (val === 0) return 'No Ice';
    if (val === 25) return 'Light';
    if (val === 50) return 'Half';
    if (val === 75) return 'Less';
    if (val === 100) return 'Regular';
    if (val === 125) return 'Extra';
    return 'Half';
  };

  const formatRating = (rating: number | undefined) => {
    if (rating === undefined || rating === null) return "0.0";
    return Number.isInteger(rating) ? `${rating}.0` : rating.toString();
  };

  const uniqueReviewsMap = new Map();
  userReviews.forEach((item: any) => {
    if (!uniqueReviewsMap.has(item._id)) {
      uniqueReviewsMap.set(item._id, item);
    }
  });
  const uniqueReviews = Array.from(uniqueReviewsMap.values());

  const stateCityMap: Record<string, string[]> = {};
  uniqueReviews.forEach((r: any) => {
    if (r.state) {
      if (!stateCityMap[r.state]) {
        stateCityMap[r.state] = [];
      }
      if (r.city && !stateCityMap[r.state].includes(r.city)) {
        stateCityMap[r.state].push(r.city);
      }
    }
  });

  const filteredReviews = uniqueReviews.filter((review: any) => {
    const matchesState = selectedStateFilter === 'ALL' || review.state === selectedStateFilter;
    const matchesCity = selectedCityFilter === 'ALL' || review.city === selectedCityFilter;
    return matchesState && matchesCity;
  });

  const groupedReviews = filteredReviews.reduce((acc: Record<string, any[]>, review: any) => {
    const place = review.restaurantName || "Other Locations";
    if (!acc[place]) {
      acc[place] = [];
    }
    acc[place].push(review);
    return acc;
  }, {});

  const getLocationButtonLabel = () => {
    if (selectedStateFilter === 'ALL') return 'Location: All Locations';
    if (selectedCityFilter === 'ALL') return `State: ${selectedStateFilter}`;
    return `${selectedCityFilter}, ${selectedStateFilter}`;
  };

  const getVisitBadgeStyle = (count: number) => {
    if (count >= 500) {
      return { bg: '#FDF4FF', border: '#F5D0FE', text: '#86198F' };
    } else if (count >= 250) {
      return { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239' };
    } else if (count >= 100) {
      return { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8' };
    } else if (count >= 50) {
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' };
    } else if (count >= 20) {
      return { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' };
    } else if (count >= 10) {
      return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309' };
    } else if (count >= 5) {
      return { bg: '#F3F4F6', border: '#E5E7EB', text: '#374151' };
    } else if (count >= 2) {
      return { bg: '#FFF7ED', border: '#FFEDD5', text: '#C2410C' };
    } else {
      return { bg: '#666768', border: '#E2E8F0', text: '#eeeef0' };
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topHeaderBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        scrollEnabled={activeTab !== 'REVIEWS' || reviewsViewMode !== 'map'}
      >
        <View style={styles.profileSectionUnderHeader}>
          <View style={styles.profileTopRow}>
            <View style={styles.imageContainer}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.blankAvatar]}>
                  <Text style={styles.avatarInitial}>
                    {(userProfile.name || userProfile.username || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.middleSection}>
              <View style={styles.userInfoContainer}>
                {userFullName ? (
                  <View style={styles.nameRow}>
                    <Text style={styles.displayName} numberOfLines={1}>{userFullName}</Text>
                    <Text style={styles.subHandleName} numberOfLines={1}>{userHandle}</Text>
                  </View>
                ) : (
                  <Text style={styles.subHandleName} numberOfLines={1}>{userHandle}</Text>
                )}
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{uniqueReviews.length}</Text>
                  <Text style={styles.statLabel}>Ratings</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{followers?.length || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{following?.length || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>

              {userProfile?._id !== currentUserId && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isFollowing ? styles.secondaryButton : null,
                    ]}
                    onPress={handleFollow}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        isFollowing ? styles.secondaryButtonText : null,
                      ]}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.messageButton]}
                    onPress={handleMessage}
                  >
                    <Ionicons name="mail-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <ReportButton reportedUserId={targetUserId} size={20} />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.activeTabPill]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'ACTIVITY' && (
          <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Activity Feed</Text>
            <Text style={styles.cardSubtitle}>Recent rating logs published by this user.</Text>
            {userReviews.length === 0 ? (
              <View style={styles.emptyTabContent}>
                <Ionicons name="pulse-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTabText}>No recent activity.</Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {userReviews.map((activity: any) => {
                  const likesTotal = activity.likes?.length || 0;
                  const commentsTotal = activity.comments?.length || 0;

                  return (
                    <View key={activity.uniqueKey || activity._id} style={styles.tweetCardItem}>
                      {profileImageUri ? (
                        <Image source={{ uri: profileImageUri }} style={styles.tweetAvatar} />
                      ) : (
                        <View style={[styles.tweetAvatar, styles.blankAvatarTweet]}>
                          <Text style={styles.avatarInitialTweet}>
                            {(userProfile.name || userProfile.username || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tweetContentColumn}>
                        <View style={styles.tweetHeaderRow}>
                          <View style={styles.tweetNameContainer}>
                            {userFullName ? (
                              <>
                                <Text style={styles.tweetFullName} numberOfLines={1}>{userFullName}</Text>
                                <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                              </>
                            ) : (
                              <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                            )}
                          </View>
                          <Text style={styles.timestampText}>{formatTimestamp(activity.createdAt || activity._creationTime)}</Text>
                        </View>

                        <Text style={styles.tweetBodyText}>
                          {activity.activityType === 'updated' ? (
                            <>
                              Updated review for <Text style={styles.boldText}>{activity.itemName}</Text> at <Text style={styles.boldText}>{activity.restaurantName}</Text>
                            </>
                          ) : (
                            <>
                              Rated <Text style={styles.boldText}>{activity.itemName}</Text> from <Text style={styles.boldText}>{activity.restaurantName}</Text>
                            </>
                          )}
                        </Text>

                        <View style={styles.tweetActionBar}>
                          <View style={styles.actionButton}>
                            <Ionicons name="heart-outline" size={16} color="#6B7280" />
                            <Text style={styles.actionCountText}>{formatCount(likesTotal)}</Text>
                          </View>
                          <View style={styles.actionButton}>
                            <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
                            <Text style={styles.actionCountText}>{formatCount(commentsTotal)}</Text>
                          </View>
                          <TouchableOpacity onPress={(e) => e.stopPropagation()} style={styles.actionButton}>
                            <BookmarkButton targetType="review" targetId={activity.uniqueKey} size={15} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={(e) => e.stopPropagation()} style={styles.actionButton}>
                            <ReportButton contentType="review" contentId={activity._id} ownerId={activity.userId} size={15} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'TWEETS' && (
          <View style={styles.tabCard}>
            <Text style={styles.cardTitle}>Tweets</Text>
            <Text style={styles.cardSubtitle}>Posts from this user.</Text>

            {userTweets.length > 0 ? (
              <View style={styles.activityList}>
                {userTweets.map((tweet: any) => {
                  const likesTotal = tweet.likes?.length || 0;
                  const commentsTotal = tweet.comments?.length || 0;

                  return (
                    <View key={tweet._id} style={styles.tweetCardItem}>
                      {profileImageUri ? (
                        <Image source={{ uri: profileImageUri }} style={styles.tweetAvatar} />
                      ) : (
                        <View style={[styles.tweetAvatar, styles.blankAvatarTweet]}>
                          <Text style={styles.avatarInitialTweet}>
                            {(userProfile.name || userProfile.username || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.tweetContentColumn}>
                        <View style={styles.tweetHeaderRow}>
                          <View style={styles.tweetNameContainer}>
                            {userFullName ? (
                              <>
                                <Text style={styles.tweetFullName} numberOfLines={1}>{userFullName}</Text>
                                <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                              </>
                            ) : (
                              <Text style={styles.tweetUsername} numberOfLines={1}>{userHandle}</Text>
                            )}
                          </View>
                          <Text style={styles.timestampText}>{formatTimestamp(tweet.createdAt || tweet._creationTime)}</Text>
                        </View>
                        <Text style={[styles.tweetBodyText, { color: "#1F2937" }]}>{tweet.body}</Text>

                        <View style={styles.tweetActionBar}>
                          <View style={styles.actionButton}>
                            <Ionicons name="heart-outline" size={16} color="#6B7280" />
                            <Text style={styles.actionCountText}>{likesTotal}</Text>
                          </View>
                          <View style={styles.actionButton}>
                            <Ionicons name="chatbubble-outline" size={15} color="#6B7280" />
                            <Text style={styles.actionCountText}>{commentsTotal}</Text>
                          </View>
                          <TouchableOpacity onPress={(e) => e.stopPropagation()} style={styles.actionButton}>
                            <BookmarkButton targetType="tweet" targetId={tweet._id} size={15} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={(e) => e.stopPropagation()} style={styles.actionButton}>
                            <ReportButton contentType="tweet" contentId={tweet._id} ownerId={tweet.userId} size={15} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyTabContent}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTabText}>No tweets yet.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'REVIEWS' && (
          <View style={styles.tabCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>Reviews</Text>
                <Text style={styles.cardSubtitle}>Submitted item evaluations grouped by establishment.</Text>
              </View>
              {/* View Toggle Button */}
              <TouchableOpacity
                style={styles.viewToggleButton}
                onPress={() => setReviewsViewMode(reviewsViewMode === 'list' ? 'map' : 'list')}
              >
                <Ionicons
                  name={reviewsViewMode === 'list' ? 'map-outline' : 'list-outline'}
                  size={16}
                  color="#6c3b3b"
                />
                <Text style={styles.viewToggleText}>
                  {reviewsViewMode === 'list' ? 'Map View' : 'List View'}
                </Text>
              </TouchableOpacity>
            </View>

            {uniqueReviews.length > 0 && (
              <View style={styles.filterDropdownWrapperSingle}>
                <TouchableOpacity 
                  style={styles.filterButton} 
                  onPress={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                >
                  <Text style={styles.filterButtonText}>
                    {getLocationButtonLabel()}
                  </Text>
                  <Ionicons name={isLocationDropdownOpen ? "chevron-up" : "chevron-down"} size={14} color="#4B5563" />
                </TouchableOpacity>

                {isLocationDropdownOpen && (
                  <View style={styles.dropdownMenuListSingle}>
                    <TouchableOpacity 
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setSelectedStateFilter('ALL');
                        setSelectedCityFilter('ALL');
                        setIsLocationDropdownOpen(false);
                        setExpandedStateInMenu(null);
                      }}
                    >
                      <Text style={[styles.dropdownMenuText, selectedStateFilter === 'ALL' && styles.selectedMenuText]}>
                        All Locations
                      </Text>
                    </TouchableOpacity>

                    {Object.entries(stateCityMap).map(([stateName, cities]) => {
                      const isStateExpanded = expandedStateInMenu === stateName;
                      const isStateSelected = selectedStateFilter === stateName && selectedCityFilter === 'ALL';

                      return (
                        <View key={stateName}>
                          <TouchableOpacity 
                            style={[styles.dropdownMenuItem, styles.stateRowItem]}
                            onPress={() => {
                              setExpandedStateInMenu(isStateExpanded ? null : stateName);
                            }}
                          >
                            <TouchableOpacity 
                              style={{ flex: 1 }}
                              onPress={() => {
                                setSelectedStateFilter(stateName);
                                setSelectedCityFilter('ALL');
                                setIsLocationDropdownOpen(false);
                                setExpandedStateInMenu(null);
                              }}
                            >
                              <Text style={[styles.dropdownMenuText, isStateSelected && styles.selectedMenuText]}>
                                📍 {stateName}
                              </Text>
                            </TouchableOpacity>
                            <Ionicons 
                              name={isStateExpanded ? "chevron-down" : "chevron-forward"} 
                              size={13} 
                              color="#6B7280" 
                              onPress={() => setExpandedStateInMenu(isStateExpanded ? null : stateName)}
                            />
                          </TouchableOpacity>

                          {isStateExpanded && (
                            <View style={styles.nestedCityList}>
                              <TouchableOpacity 
                                style={styles.dropdownMenuItem}
                                onPress={() => {
                                  setSelectedStateFilter(stateName);
                                  setSelectedCityFilter('ALL');
                                  setIsLocationDropdownOpen(false);
                                  setExpandedStateInMenu(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, selectedStateFilter === stateName && selectedCityFilter === 'ALL' && styles.selectedMenuText]}>
                                  ↳ All Cities in {stateName}
                                </Text>
                              </TouchableOpacity>

                              {cities.map((cityName: string) => {
                                const isCitySelected = selectedStateFilter === stateName && selectedCityFilter === cityName;
                                return (
                                  <TouchableOpacity 
                                    key={cityName} 
                                    style={styles.dropdownMenuItem}
                                    onPress={() => {
                                      setSelectedStateFilter(stateName);
                                      setSelectedCityFilter(cityName);
                                      setIsLocationDropdownOpen(false);
                                      setExpandedStateInMenu(null);
                                    }}
                                  >
                                    <Text style={[styles.dropdownMenuText, isCitySelected && styles.selectedMenuText]}>
                                      ↳ {cityName}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {filteredReviews.length === 0 ? (
              <View style={styles.emptyTabContent}>
                <Ionicons name="star-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTabText}>No reviews match your location filter.</Text>
              </View>
            ) : reviewsViewMode === 'list' ? (
              <View style={[styles.dropdownContainer, { marginTop: 12 }]}>
                {Object.entries(groupedReviews).map(([restaurantName, items]: [string, any[]]) => {
                  const isExpanded = expandedRestaurant === restaurantName;
                  const streetAddress = items[0]?.address || "";
                  const cityName = items[0]?.city || "";
                  const stateName = items[0]?.state || "";
                  const cityAndState = [cityName, stateName].filter(Boolean).join(", ");
                  const visitCount = items[0]?.visitCount || 1;
                  const rankBadge = getVisitBadgeStyle(visitCount);

                  return (
                    <View key={restaurantName} style={styles.restaurantAccordionWrapper}>
                      <TouchableOpacity 
                        style={styles.restaurantHeaderRow}
                        onPress={() => toggleRestaurantDropdown(restaurantName)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.restaurantMainRow}>
                          <Ionicons name="storefront-outline" size={24} color="#6c3b3b" style={styles.restaurantIcon} />
                          <View style={styles.restaurantTextColumn}>
                            <View style={styles.topInfoRow}>
                              <Text style={styles.restaurantNameText} numberOfLines={1}>{restaurantName}</Text>
                              <View style={[styles.visitBadgeInline, { backgroundColor: rankBadge.bg, borderColor: rankBadge.border }]}>
                                <Text style={[styles.visitBadgeInlineText, { color: rankBadge.text }]}>
                                  {visitCount} visits
                                </Text>
                              </View>
                            </View>
                            {streetAddress ? (
                              <Text style={styles.restaurantAddressText} numberOfLines={1}>{streetAddress}</Text>
                            ) : null}
                            {cityAndState ? (
                              <Text style={styles.restaurantCityText} numberOfLines={1}>{cityAndState}</Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.restaurantRightAction}>
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{items.length}</Text>
                          </View>
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={16} 
                            color="#4B5563" 
                          />
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.dropdownItemsList}>
                          {items.map((review: any) => (
                            <View key={review._id} style={styles.reviewSubItem}>
                              <View style={styles.reviewSubHeader}>
                                <Text style={styles.reviewItemName} numberOfLines={1}>{review.itemName}</Text>
                                <View style={styles.reviewSubActions}>
                                  <View style={styles.starRow}>
                                    <Ionicons name="star" size={13} color="#FBBF24" />
                                    <Text style={styles.reviewRatingText}>{formatRating(review.overallRating)}</Text>
                                  </View>
                                </View>
                              </View>
                              {review.notes ? (
                                <Text style={styles.reviewNotesText} numberOfLines={2}>&ldquo;{review.notes}&rdquo;</Text>
                              ) : null}
                              {review.imageStorageId && userReviewImageUrls[review.imageStorageId] ? (
                                <Image
                                  source={{ uri: userReviewImageUrls[review.imageStorageId] }}
                                  style={styles.userReviewThumbnail}
                                />
                              ) : null}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.mapContainer}>
                {MapView && filteredReviews.some((review: any) => review.lat && review.lng) ? (
                  <MapView
                    style={styles.map}
                    styleURL="mapbox://styles/mapbox/streets-v12"
                    zoomEnabled={true}
                    scrollEnabled={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                  >
                    <Camera
                      zoomLevel={12}
                      centerCoordinate={[
                        filteredReviews.find((r: any) => r.lat && r.lng)?.lng || -122.4194,
                        filteredReviews.find((r: any) => r.lat && r.lng)?.lat || 37.7749,
                      ]}
                    />
                    {filteredReviews.map((review: any, index: number) => {
                      if (review.lat && review.lng && PointAnnotation) {
                        return (
                          <PointAnnotation
                            key={`marker-${review._id || index}`}
                            id={`marker-${review._id || index}`}
                            coordinate={[review.lng, review.lat]}
                            onSelected={() => setSelectedPinReview(review)}
                          >
                            <TouchableOpacity 
                              activeOpacity={0.9}
                              onPress={() => setSelectedPinReview(review)}
                              style={styles.mapPinContainer}
                            >
                              <View style={styles.mapPinBubble}>
                                <Ionicons name="storefront" size={12} color="#FFFFFF" />
                                <Text style={styles.mapPinText} numberOfLines={1}>
                                  {review.restaurantName}
                                </Text>
                              </View>
                              <View style={styles.mapPinPointer} />
                            </TouchableOpacity>
                          </PointAnnotation>
                        );
                      }
                      return null;
                    })}
                  </MapView>
                ) : !MapView ? (
                  <View style={styles.mapPlaceholderContainer}>
                    <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mapPlaceholderTitle}>Map Not Available</Text>
                    <Text style={styles.mapPlaceholderText}>
                      The map module requires a custom native build.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mapPlaceholderContainer}>
                    <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mapPlaceholderTitle}>No Location Data</Text>
                    <Text style={styles.mapPlaceholderText}>
                      The restaurants reviewed by this user don't have coordinates yet.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'PREFERENCES' && (
          <View style={[styles.preferenceBobaCard, { backgroundColor: themeColor, shadowOpacity: 0, elevation: 0 }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitle}>My Boba Taste Fingerprint</Text>
                <Text style={styles.cardSubtitle}>This user&apos;s baseline taste profile preferences.</Text>
              </View>
            </View>

            <View style={styles.prefDisplayRow}>
              <View style={styles.prefDisplayItem}>
                <Text style={styles.prefDisplayIcon}>🍯</Text>
                <View style={styles.prefDisplayContent}>
                  <Text style={styles.prefDisplayLabel}>Sweetness</Text>
                  <Text style={styles.prefDisplayValue}>{getSweetnessLabel(sweetnessPref)}</Text>
                </View>
              </View>

              <View style={styles.prefDisplayItem}>
                <Text style={styles.prefDisplayIcon}>❄️</Text>
                <View style={styles.prefDisplayContent}>
                  <Text style={styles.prefDisplayLabel}>Ice Level</Text>
                  <Text style={styles.prefDisplayValue}>{getIceLabel(icePref)}</Text>
                </View>
              </View>

              <View style={styles.prefDisplayItem}>
                <Text style={styles.prefDisplayIcon}>🥛</Text>
                <View style={styles.prefDisplayContent}>
                  <Text style={styles.prefDisplayLabel}>Milk Base</Text>
                  <Text style={styles.prefDisplayValue}>{milkPref}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Split Modal Popup for Map Pin Actions */}
      <Modal
        visible={selectedPinReview !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPinReview(null)}
      >
        <View style={styles.splitModalOverlay}>
          <View style={styles.splitModalContainer}>
            <View style={styles.splitModalHeader}>
              <Ionicons name="storefront" size={24} color="#6c3b3b" />
              <Text style={styles.splitModalTitle} numberOfLines={1}>{selectedPinReview?.restaurantName}</Text>
              <Text style={styles.splitModalSubtitle} numberOfLines={1}>
                Reviewed: {selectedPinReview?.itemName} (⭐ {formatRating(selectedPinReview?.overallRating)})
              </Text>
            </View>

            <View style={styles.splitCardsRow}>
              <TouchableOpacity
                style={styles.splitCard}
                activeOpacity={0.8}
                onPress={() => {
                  const rId = selectedPinReview?.restaurantId || selectedPinReview?.shopId;
                  setSelectedPinReview(null);
                  if (rId) router.push(`/restaurant/${rId}`);
                }}
              >
                <View style={styles.splitCardIconBox}>
                  <Ionicons name="business-outline" size={32} color="#6c3b3b" />
                </View>
                <Text style={styles.splitCardTitle}>Restaurant</Text>
                <Text style={styles.splitCardDesc}>View establishment & menu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.splitCard}
                activeOpacity={0.8}
                onPress={() => {
                  const revId = selectedPinReview?._id;
                  setSelectedPinReview(null);
                  if (revId) {
                    router.push({
                      pathname: '/restaurant/post/[reviewId]',
                      params: { reviewId: revId, activityType: selectedPinReview?.activityType || 'review' }
                    });
                  }
                }}
              >
                <View style={styles.splitCardIconBox}>
                  <Ionicons name="star-outline" size={32} color="#6c3b3b" />
                </View>
                <Text style={styles.splitCardTitle}>Full Review</Text>
                <Text style={styles.splitCardDesc}>View ratings & notes</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.splitModalCloseButton}
              onPress={() => setSelectedPinReview(null)}
            >
              <Text style={styles.splitModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Pill Navigation */}
      <View style={styles.floatingPillContainer}>
        <TouchableOpacity style={styles.pillItem} onPress={() => router.push("/(tabs)/home")}>
          <Ionicons name="home" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => router.push("/(tabs)/search")}>
          <Ionicons name="search" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => router.push("/(tabs)/notification")}>
          <Ionicons name="heart-outline" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillItem} onPress={() => router.push("/(tabs)/profile")}>
          <Ionicons name="person-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Auth Required Modal */}
      <Modal
        visible={isAuthModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.authModalHeader}>
              <Ionicons name="lock-closed" size={32} color="#6c3b3b" />
              <Text style={styles.authModalTitle}>Authentication Required</Text>
            </View>

            <Text style={styles.authModalMessage}>
              You need to be logged in to follow or message other users.
            </Text>

            <View style={styles.authModalActions}>
              <TouchableOpacity
                style={styles.authModalButton}
                onPress={() => setAuthModalVisible(false)}
              >
                <Text style={styles.authModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authModalButton, styles.authModalPrimaryButton]}
                onPress={() => {
                  setAuthModalVisible(false);
                  router.replace('/');
                }}
              >
                <Text style={styles.authModalPrimaryButtonText}>Sign Up / Login</Text>
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
    backgroundColor: "#F9FAFB",
  },
  topHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
  },
  profileSectionUnderHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageContainer: {
    width: 76,
    height: 76,
  },
  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  blankAvatar: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6c3b3b",
  },
  middleSection: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
    gap: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 28,
  },
  statItem: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "left",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "left",
  },
  userInfoContainer: {
    marginTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },
  displayName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  subHandleName: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#6c3b3b",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6c3b3b",
  },
  secondaryButtonText: {
    color: "#6c3b3b",
  },
  messageButton: {
    minWidth: 40,
    paddingHorizontal: 12,
  },
  scrollContainer: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  activeTabPill: {
    backgroundColor: "#6c3b3b",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  preferenceBobaCard: {
    borderRadius: 16,
    padding: 20,
    paddingBottom: 30,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 16,
    lineHeight: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c3b3b',
  },
  mapContainer: {
    marginTop: 12,
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c3b3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapPinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 120,
  },
  mapPinPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#6c3b3b',
    marginTop: -1,
  },
  mapPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyTabContent: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTabText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  activityList: {
    gap: 10,
    marginTop: 4,
  },
  tweetCardItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tweetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  blankAvatarTweet: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitialTweet: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6c3b3b",
  },
  tweetContentColumn: {
    flex: 1,
    justifyContent: "flex-start",
  },
  tweetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  tweetNameContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  tweetFullName: {
    fontSize: 13,
    fontWeight: "700",
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  tweetUsername: {
    fontSize: 11,
    fontWeight: "400",
    color: "#6B7280",
  },
  timestampText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  tweetBodyText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "400",
  },
  boldText: {
    fontWeight: "700",
    color: "#1F2937",
  },
  tweetActionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterDropdownWrapperSingle: {
    position: 'relative',
    marginBottom: 8,
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownMenuListSingle: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
    maxHeight: 250,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stateRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  nestedCityList: {
    backgroundColor: '#F9FAFB',
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownMenuText: {
    fontSize: 12,
    color: '#4B5563',
  },
  selectedMenuText: {
    fontWeight: '700',
    color: '#6c3b3b',
  },
  dropdownContainer: {
    gap: 6,
  },
  restaurantAccordionWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  restaurantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  restaurantMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  restaurantIcon: {
    marginTop: 2,
  },
  restaurantTextColumn: {
    flex: 1,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  restaurantNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  visitBadgeInline: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  visitBadgeInlineText: {
    fontSize: 10,
    fontWeight: '700',
  },
  restaurantAddressText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 0.5,
  },
  restaurantCityText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 0.5,
  },
  restaurantRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  dropdownItemsList: {
    padding: 8,
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewSubItem: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 2,
  },
  reviewSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewSubActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 2,
  },
  reviewNotesText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  userReviewThumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'cover',
    marginTop: 8,
  },
  prefDisplayRow: {
    gap: 12,
  },
  prefDisplayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prefDisplayIcon: {
    fontSize: 24,
  },
  prefDisplayContent: {
    flex: 1,
  },
  prefDisplayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  prefDisplayValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  floatingPillContainer: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 60,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 4,
    paddingTop: 4,
  },
  pillItem: {
    padding: 3,
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  authModalHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  authModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  authModalActions: {
    gap: 12,
  },
  authModalButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  authModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  authModalPrimaryButton: {
    backgroundColor: '#6c3b3b',
  },
  authModalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* Split Modal Styles */
  splitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splitModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  splitModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  splitModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  splitModalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  splitCardsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  splitCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCardIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  splitCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  splitCardDesc: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  splitModalCloseButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  splitModalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});