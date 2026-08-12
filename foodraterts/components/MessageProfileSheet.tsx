import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { formatCount } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MessageProfileSheetProps {
  visible: boolean;
  userId: string;
  username: string;
  onClose: () => void;
  onMessagePress: () => void;
  onViewFullProfile: (username: string) => void;
  currentUserId: string;
}

export default function MessageProfileSheet({
  visible,
  userId,
  username,
  onClose,
  onMessagePress,
  onViewFullProfile,
  currentUserId,
}: MessageProfileSheetProps) {
  const userProfile = useQuery(api.users.getUser, { userId });
  const followers = useQuery(api.users.getFollowers, userId ? { userId: userId as Id<"users"> } : "skip");
  const following = useQuery(api.users.getFollowing, userId ? { userId: userId as Id<"users"> } : "skip");
  const userReviews = useQuery(api.items.getUserReviewsByUserId, userId ? { userId: userId as Id<"users"> } : "skip");
  const userTweets = useQuery(api.tweets?.getTweetsByUserId, userId ? { userId: userId as Id<"users"> } : "skip") || [];

  const isFollowing = useQuery(api.users.isFollowing, userId ? { followingId: userId as Id<"users"> } : "skip");
  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);

  // Resolve profile picture URL
  const profilePictureUrl = useQuery(
    api.images.getPublicUrl,
    userProfile?.profilePicture ? { storageId: userProfile.profilePicture } : "skip"
  );

  const profileImageUri = profilePictureUrl ?? undefined;
  const userHandle = userProfile?.username ? `@${userProfile.username}` : "@user";
  const userFullName = userProfile?.name || null;

  const handleFollowToggle = async () => {
    if (!currentUserId) return;
    try {
      if (isFollowing) {
        await unfollowUser({ followingId: userId as any });
      } else {
        await followUser({ followingId: userId as any });
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleViewFullProfile = () => {
    onClose();
    onViewFullProfile(username);
  };

  if (!userProfile) {
    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6c3b3b" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const isOwnProfile = currentUserId === userProfile._id;
  const reviewCount = userReviews?.length || 0;
  const tweetCount = userTweets?.length || 0;
  const followersCount = followers?.length || 0;
  const followingCount = following?.length || 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={styles.overlayBackground} onPress={onClose}>
          <View style={styles.sheetContainer}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.sheetContent}>
                {/* Handle bar */}
                <View style={styles.handleBarContainer}>
                  <View style={styles.handleBar} />
                </View>

                {/* Header Section */}
                <View style={styles.headerSection}>
                  <View style={styles.avatarContainer}>
                    {profileImageUri ? (
                      <Image source={{ uri: profileImageUri }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.blankAvatar]}>
                        <Text style={styles.avatarInitial}>
                          {(userFullName || userProfile.username || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    {userFullName && (
                      <Text style={styles.fullName} numberOfLines={1}>
                        {userFullName}
                      </Text>
                    )}
                    <Text style={styles.username} numberOfLines={1}>
                      {userHandle}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatCount(reviewCount)}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatCount(followersCount)}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatCount(followingCount)}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={onMessagePress}
                    >
                      <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        isFollowing ? styles.followingButton : styles.followButton
                      ]}
                      onPress={handleFollowToggle}
                    >
                      <Text style={[
                        styles.actionButtonText,
                        isFollowing && styles.followingButtonText
                      ]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* View Full Profile Button */}
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={handleViewFullProfile}
                >
                  <Text style={styles.viewProfileText}>View Full Profile</Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>

                {/* Recent Activity Preview */}
                {(reviewCount > 0 || tweetCount > 0) && (
                  <View style={styles.activityPreview}>
                    <Text style={styles.activityTitle}>Recent Activity</Text>
                    {reviewCount > 0 && (
                      <View style={styles.activityItem}>
                        <Ionicons name="star-outline" size={16} color="#FBBF24" />
                        <Text style={styles.activityText}>
                          {formatCount(reviewCount)} reviews
                        </Text>
                      </View>
                    )}
                    {tweetCount > 0 && (
                      <View style={styles.activityItem}>
                        <Ionicons name="chatbubbles-outline" size={16} color="#6B7280" />
                        <Text style={styles.activityText}>
                          {formatCount(tweetCount)} posts
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    gap: 16,
  },
  avatarContainer: {
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  blankAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#6c3b3b',
  },
  followButton: {
    backgroundColor: '#6c3b3b',
  },
  followingButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#6c3b3b',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#6c3b3b',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  viewProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityPreview: {
    paddingVertical: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
  },
});