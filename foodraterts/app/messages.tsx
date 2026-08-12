import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { formatTimestamp } from '../utils/formatters';
import MessageProfileSheet from '../components/MessageProfileSheet';

type TabType = 'messages' | 'general' | 'requests';

export default function MessagesScreen() {
  const router = useRouter();
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

  // Collect all profile picture storage IDs to fetch public URLs in bulk
  const profileStorageIds = conversations
    .map((c: any) => c?.otherUser?.profilePicture)
    .filter((id: string | undefined) => id && !id.startsWith('http'));

  const profileImageUrls = useQuery(
    api.images.getPublicUrls,
    profileStorageIds.length > 0 ? { storageIds: profileStorageIds } : "skip"
  ) || {};

  const markAsRead = useMutation(api.messaging.markMessagesAsRead);

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

  const handleMessageFromProfile = () => {
    if (selectedProfileUserId) {
      const conversation = conversations.find((c: any) => c.otherUser?._id === selectedProfileUserId);
      if (conversation) {
        handleCloseProfileSheet();
        router.push({
          pathname: '/messages/[conversationId]' as any,
          params: { conversationId: conversation._id, otherUserId: selectedProfileUserId }
        } as any);
      }
    }
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
    <SafeAreaView style={styles.safeContainer} edges={["bottom"]}>
      <Stack.Screen options={{
        headerShown: true,
        title: 'Messages',
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

      {/* Search Users Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.searchResults} keyboardShouldPersistTaps={false}>
              {searchQuery.length >= 2 ? (
                searchResults.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setSearchModalVisible(false);
                      handleProfilePress(user._id, user.username);
                    }}
                  >
                    <View style={styles.searchResultAvatar}>
                      {user.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.searchAvatar} />
                      ) : (
                        <View style={[styles.searchAvatar, styles.searchBlankAvatar]}>
                          <Text style={styles.searchAvatarInitial}>
                            {(user.name || user.username || "U").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName}>
                        {user.name || user.username}
                      </Text>
                      <Text style={styles.searchResultUsername}>
                        @{user.username}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>
                    {searchQuery.length < 2
                      ? 'Type at least 2 characters to search'
                      : 'No users found'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  searchModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  searchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  searchBlankAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  searchResultUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchEmptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});