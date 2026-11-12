import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { formatTimestamp } from '../../utils/formatters';

export default function ChatInfoScreen() {
  const router = useRouter();
  const { conversationId, otherUserId } = useLocalSearchParams<{
    conversationId: string;
    otherUserId: string;
  }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const currentUser = useQuery(api.users.viewer);
  const otherUser = useQuery(api.users.getUser, { userId: otherUserId as string });
  const messages =
    useQuery(api.messaging.getMessages, { conversationId: conversationId as string }) || [];

  const mediaMessages = messages.filter((m: any) => m?.imageStorageId && !m.isUnsent);

  // Resolve avatar + media storage IDs to URLs in one bulk call
  const avatarStorageId =
    otherUser?.profilePicture && !String(otherUser.profilePicture).startsWith('http')
      ? otherUser.profilePicture
      : null;
  const storageIds = [
    ...(avatarStorageId ? [avatarStorageId] : []),
    ...mediaMessages.map((m: any) => m.imageStorageId),
  ];
  const imageUrls = useQuery(
    api.images.getPublicUrls,
    storageIds.length > 0 ? { storageIds } : 'skip'
  ) || {};

  const avatarUri = otherUser?.profilePicture
    ? String(otherUser.profilePicture).startsWith('http')
      ? otherUser.profilePicture
      : imageUrls[otherUser.profilePicture]
    : null;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults =
    trimmedQuery.length > 0
      ? messages.filter(
          (m: any) => !m.isUnsent && m.content?.toLowerCase().includes(trimmedQuery)
        )
      : [];

  const otherUserName = otherUser?.name || otherUser?.username || 'User';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: otherUserName,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { color: '#1F2937', fontWeight: '700' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Profile card */}
        <View style={styles.profileCard}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarBlank]}>
              <Text style={styles.profileAvatarInitial}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.profileName}>{otherUser?.name || otherUser?.username}</Text>
          {otherUser?.username && (
            <Text style={styles.profileUsername}>@{otherUser.username}</Text>
          )}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/user/[username]' as any,
                params: { username: otherUser?.username || '' },
              } as any)
            }
          >
            <Ionicons name="person-outline" size={16} color="#FFFFFF" />
            <Text style={styles.profileButtonText}>View profile</Text>
          </TouchableOpacity>
        </View>

        {/* Message search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in conversation"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>

        {trimmedQuery.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Messages</Text>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>No messages found</Text>
            ) : (
              searchResults.map((m: any) => (
                <View key={m._id} style={styles.resultRow}>
                  <Text style={styles.resultSender}>
                    {m.senderId === currentUser?._id
                      ? 'You'
                      : m.sender?.name || m.sender?.username || 'User'}
                  </Text>
                  <Text style={styles.resultContent} numberOfLines={2}>
                    {m.imageStorageId ? '📷 Image' : m.content}
                  </Text>
                  <Text style={styles.resultTime}>{formatTimestamp(m.createdAt)}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media</Text>
            {mediaMessages.length === 0 ? (
              <View style={styles.mediaEmpty}>
                <Ionicons name="images-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>No media yet</Text>
              </View>
            ) : (
              <View style={styles.mediaGrid}>
                {mediaMessages.map((m: any) => {
                  const url = imageUrls[m.imageStorageId] || m.imageStorageId;
                  return (
                    <TouchableOpacity
                      key={m._id}
                      style={styles.mediaTile}
                      onPress={() => setViewingImageUrl(url)}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Full-screen image viewer (tap anywhere to close) */}
      <Modal
        visible={!!viewingImageUrl}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewingImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.viewerOverlay}
          activeOpacity={1}
          onPress={() => setViewingImageUrl(null)}
        >
          <Image
            source={{ uri: viewingImageUrl || undefined }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
          <View style={styles.viewerCloseBadge} pointerEvents="none">
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  profileAvatarBlank: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileUsername: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 14,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6c3b3b',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 10,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  mediaTile: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  resultRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 2,
  },
  resultSender: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultContent: {
    fontSize: 14,
    color: '#374151',
  },
  resultTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerCloseBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
