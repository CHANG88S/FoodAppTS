import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ProfileAvatar } from './ProfileAvatar';
import { Id } from '../convex/_generated/dataModel';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type User = {
  _id: Id<"users">;
  username: string;
  name?: string;
  profilePicture?: string;
};

type FollowersModalProps = {
  visible: boolean;
  onClose: () => void;
  username: string;
  initialTab?: 'followers' | 'following';
};

export function FollowersModal({ visible, onClose, username, initialTab = 'followers' }: FollowersModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Get the target user's ID from their username
  const targetUser = useQuery(api.users.getUserByUsername, {
    username: username
  });

  const followers = useQuery(
    api.users.getFollowers,
    targetUser?._id ? { userId: targetUser._id as any } : "skip"
  );

  const following = useQuery(
    api.users.getFollowing,
    targetUser?._id ? { userId: targetUser._id as any } : "skip"
  );

  const currentUser = useQuery(api.users.viewer) as any;

  const displayData = activeTab === 'followers' ? followers : following;
  const isOwnProfile = currentUser?.username === username;

  const handleUserPress = (user: User) => {
    onClose();
    // Navigate to user profile after closing modal
    setTimeout(() => {
      router.push(`/user/${user.username}`);
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isOwnProfile ? 'Your' : `${targetUser?.name || targetUser?.username || 'User'}'s`} {activeTab === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
              onPress={() => setActiveTab('followers')}
            >
              <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                Followers ({followers?.length || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'following' && styles.activeTab]}
              onPress={() => setActiveTab('following')}
            >
              <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                Following ({following?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {targetUser?._id && displayData ? (
            <FlatList
              data={displayData}
              keyExtractor={(item) => item?._id || Math.random().toString()}
              renderItem={({ item }) => item && <UserCard user={item} onPress={handleUserPress} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name={activeTab === 'followers' ? 'people-outline' : 'person-outline'} size={48} color="#ccc" />
                  <Text style={styles.emptyTitle}>
                    {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6c3b3b" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function UserCard({
  user,
  onPress,
}: {
  user: any;
  onPress: (user: any) => void;
}) {
  const currentUser = useQuery(api.users.viewer) as any;
  const isOwnProfile = currentUser?.username === user.username;

  // Don't show follow button for own profile
  const isFollowing = useQuery(
    api.users.isFollowing,
    isOwnProfile ? "skip" : { followingId: user._id }
  );

  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);

  const handleFollowPress = async () => {
    if (isFollowing) {
      await unfollowUser({ followingId: user._id });
    } else {
      await followUser({ followingId: user._id });
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(user)} activeOpacity={0.7}>
      <View style={styles.userCard}>
        <ProfileAvatar
          storageId={user.profilePicture}
          size={48}
          variant="brand"
          fallbackText={user.name || user.username}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.username}>@{user.username}</Text>
          {user.name && <Text style={styles.displayName}>{user.name}</Text>}
        </View>

        {!isOwnProfile && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followingButton : styles.followButtonActive,
            ]}
            onPress={handleFollowPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing ? styles.followingButtonText : styles.followButtonActiveText,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.8,
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  displayName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6c3b3b',
    minWidth: 90,
    alignItems: 'center',
  },
  followButtonActive: {
    backgroundColor: '#6c3b3b',
  },
  followingButton: {
    backgroundColor: 'transparent',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followButtonActiveText: {
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#6c3b3b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});