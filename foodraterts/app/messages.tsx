import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '../utils/formatters';
import MessageProfileSheet from '../components/MessageProfileSheet';

type TabType = 'messages' | 'general' | 'requests';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [refreshing, setRefreshing] = useState(false);
  const [profileSheetVisible, setProfileSheetVisible] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = useQuery(api.messaging.listConversations, { tab: activeTab }) || [];
  const unreadCount = useQuery(api.messaging.getUnreadCount) || 0;
  const currentUser = useQuery(api.users.viewer);
  const searchResults = useQuery(api.messaging.searchUsers, { searchQuery }) || [];
  const suggestedUsers = useQuery(
    api.users.getFollowing,
    currentUser ? { userId: currentUser._id as Id<"users"> } : "skip"
  ) || [];

  // Collect all profile picture storage IDs to fetch public URLs in bulk
  const profileStorageIds = conversations
    .map((c: any) => c?.otherUser?.profilePicture)
    .filter((id: string | undefined) => id && !id.startsWith('http'));

  const profileImageUrls = useQuery(
    api.images.getPublicUrls,
    profileStorageIds.length > 0 ? { storageIds: profileStorageIds } : "skip"
  ) || {};

  // Resolve user avatars (storage IDs) to public URLs for the new-message screen
  const messageUserStorageIds = Array.from(new Set(
    [...suggestedUsers, ...searchResults]
      .map((user: any) => user?.profilePicture)
      .filter((id: any) => id && !String(id).startsWith('http'))
  ));

  const searchImageUrls = useQuery(
    api.images.getPublicUrls,
    messageUserStorageIds.length > 0 ? { storageIds: messageUserStorageIds } : "skip"
  ) || {};

  const markAsRead = useMutation(api.messaging.markMessagesAsRead);
  const startConversation = useMutation(api.messaging.startConversation);

  const handleProfilePress = (userId: string, username: string) => {
    setSelectedProfileUserId(userId);
    setSelectedProfileUsername(username);
    setProfileSheetVisible(true);
  };

  const handleCloseProfileSheet = () => {
    setProfileSheetVisible(false);
    setSelectedProfileUserId(null);
    setSelectedProfileUsername(null);
  };

  const handleMessageFromProfile = async () => {
    if (!selectedProfileUserId) return;
    handleCloseProfileSheet();
    // startConversation returns the existing conversation when one already exists
    try {
      const conversationId = await startConversation({ otherUserId: selectedProfileUserId });
      router.push({
        pathname: '/messages/[conversationId]' as any,
        params: { conversationId, otherUserId: selectedProfileUserId }
      } as any);
    } catch (err: any) {
      Alert.alert('Unable to message', err.message || 'Please try again.');
    }
  };

  // Tapping a search result opens a conversation with that user directly
  const handleMessageSearchResult = async (user: { _id: string }) => {
    setSearchModalVisible(false);
    setSearchQuery('');
    try {
      const conversationId = await startConversation({ otherUserId: user._id });
      router.push({
        pathname: '/messages/[conversationId]' as any,
        params: { conversationId, otherUserId: user._id }
      } as any);
    } catch (err: any) {
      Alert.alert('Unable to message', err.message || 'Please try again.');
    }
  };

  const resolveSearchAvatar = (rawPic?: string) =>
    rawPic ? (rawPic.startsWith('http') ? rawPic : searchImageUrls[rawPic]) : null;

  const handleCloseSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
  };

  const handleViewFullProfile = (username: string) => {
    handleCloseProfileSheet();
    router.push({
      pathname: '/user/[username]' as any,
      params: { username }
    } as any);
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      markAsRead();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const renderConversation = ({ item }: { item: any }) => {
    if (!item.otherUser) return null;

    const rawPic = item.otherUser.profilePicture;
    // Resolve storage ID to public URL or use raw URI if it's already an http link
    const avatarUri = rawPic ? (rawPic.startsWith('http') ? rawPic : profileImageUrls[rawPic]) : null;

    const lastMessageText = item.lastMessage
      ? item.lastMessage.isUnsent
        ? 'Message unsent'
        : item.lastMessage.imageStorageId
          ? '📷 Image'
          : item.lastMessage.content
      : 'No messages yet';

    const timestamp = item.lastMessage
      ? formatTimestamp(item.lastMessage.createdAt)
      : '';

    return (
      <View style={styles.conversationItem}>
        <TouchableOpacity
          onPress={() => handleProfilePress(item.otherUser._id, item.otherUser.username)}
          style={styles.avatarContainer}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.blankAvatar]}>
              <Text style={styles.avatarInitial}>
                {(item.otherUser.name || item.otherUser.username || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => router.push({
            pathname: '/messages/[conversationId]' as any,
            params: { conversationId: item._id, otherUserId: item.otherUser._id }
          } as any)}
        >
          <View style={styles.conversationHeader}>
            <TouchableOpacity
              onPress={() => handleProfilePress(item.otherUser._id, item.otherUser.username)}
            >
              <Text style={styles.username}>
                {item.otherUser.name || item.otherUser.username}
              </Text>
            </TouchableOpacity>
            {timestamp && (
              <Text style={styles.timestamp}>{timestamp}</Text>
            )}
          </View>

          <View style={styles.messagePreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessageText}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTab = (tabName: TabType, label: string) => {
    const isActive = activeTab === tabName;
    const badgeCount = tabName === 'messages' ? unreadCount : 0;

    return (
      <TouchableOpacity
        key={tabName}
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveTab(tabName)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {label}
        </Text>
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.safeContainer} edges={["bottom"]}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Messages',
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { color: '#1F2937', fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            style={styles.headerPlusButton}
          >
            <Ionicons name="add-circle-outline" size={24} color="#6c3b3b" />
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.tabsContainer}>
        {renderTab('messages', 'Messages')}
        {renderTab('general', 'General')}
        {renderTab('requests', 'Requests')}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'messages' && 'Start following users to see their messages here'}
              {activeTab === 'general' && 'Other conversations will appear here'}
              {activeTab === 'requests' && 'Messages from users you don\'t follow appear here'}
            </Text>
          </View>
        }
      />

      {/* Instagram-style Profile Sheet */}
      {selectedProfileUserId && selectedProfileUsername && currentUser && (
        <MessageProfileSheet
          visible={profileSheetVisible}
          userId={selectedProfileUserId}
          username={selectedProfileUsername}
          onClose={handleCloseProfileSheet}
          onMessagePress={handleMessageFromProfile}
          onViewFullProfile={handleViewFullProfile}
          currentUserId={currentUser._id}
        />
      )}

      {/* New Message — full screen (Instagram-style) */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={handleCloseSearchModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.newMessageContainer, { paddingTop: insets.top }]}>
          <View style={styles.newMessageHeader}>
            <TouchableOpacity
              onPress={handleCloseSearchModal}
              style={styles.newMessageCloseButton}
            >
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.newMessageTitle}>New message</Text>
            <View style={styles.newMessageHeaderSpacer} />
          </View>

          <View style={styles.toRow}>
            <Text style={styles.toLabel}>To:</Text>
            <TextInput
              style={styles.toInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionHeader}>
            {searchQuery.trim().length >= 2 ? 'Search results' : 'Suggested'}
          </Text>

          <FlatList
            data={searchQuery.trim().length >= 2 ? searchResults : suggestedUsers}
            keyExtractor={(user: any) => user._id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item: user }) => {
              const avatarUri = resolveSearchAvatar(user.profilePicture);
              return (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => handleMessageSearchResult(user)}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.userRowAvatar} />
                  ) : (
                    <View style={[styles.userRowAvatar, styles.userRowBlankAvatar]}>
                      <Text style={styles.userRowAvatarInitial}>
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userRowInfo}>
                    <Text style={styles.userRowName} numberOfLines={1}>
                      {user.name || user.username}
                    </Text>
                    <Text style={styles.userRowUsername} numberOfLines={1}>
                      @{user.username}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.newMessageEmpty}>
                <Text style={styles.newMessageEmptyText}>
                  {searchQuery.trim().length >= 2
                    ? 'No users found'
                    : 'Find someone to message'}
                </Text>
              </View>
            }
          />
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6c3b3b',
  },
  badge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 90,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  blankAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerPlusButton: {
    marginRight: 16,
    padding: 4,
  },
  newMessageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  newMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  newMessageCloseButton: {
    marginRight: 12,
  },
  newMessageTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  newMessageHeaderSpacer: {
    width: 28,
  },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 10,
  },
  toInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userRowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  userRowBlankAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRowAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  userRowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRowUsername: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  newMessageEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  newMessageEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});