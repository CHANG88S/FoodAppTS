import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { formatTimestamp } from '../../utils/formatters';
import { ReportButton } from '../../components/ReportButton';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, otherUserId } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAsset, setSelectedImageAsset] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [actionMessage, setActionMessage] = useState<any>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Lift the UI above the keyboard manually (KeyboardAvoidingView is unreliable
  // on the new architecture)
  useEffect(() => {
    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates.height);
    const onHide = () => setKeyboardHeight(0);
    const showListener = Keyboard.addListener('keyboardWillShow', onShow);
    const hideListener = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const messages = useQuery(api.messaging.getMessages, {
    conversationId: conversationId as string,
  }) || [];

  const currentUser = useQuery(api.users.viewer);
  const otherUser = useQuery(api.users.getUser, {
    userId: otherUserId as string,
  });

  // Whether this chat is still a pending message request for the current user
  const requestState = useQuery(api.messaging.getConversationRequestState, {
    conversationId: conversationId as string,
  });

  // Check if conversation exists, if not create it
  const startConversationMutation = useMutation(api.messaging.startConversation);

  useEffect(() => {
    const initializeConversation = async () => {
      if (!currentUser || !otherUser) return;

      try {
        // Start a conversation (will return existing one if it exists)
        const newConversationId = await startConversationMutation({
          otherUserId: otherUser._id
        });

        // Update the URL if the conversation ID is different
        if (newConversationId !== conversationId) {
          router.replace({
            pathname: '/messages/[conversationId]' as any,
            params: {
              conversationId: newConversationId,
              otherUserId: otherUser._id
            }
          } as any);
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initializeConversation();
  }, [currentUser, otherUser]);

  // Get image URLs for messages with images
  const messageImages = useQuery(api.images.getPublicUrls, {
    storageIds: messages
      .filter((m: any) => m?.imageStorageId && !m.isUnsent)
      .map((m: any) => m.imageStorageId)
  }) || {};

  const sendMessageMutation = useMutation(api.messaging.sendMessage);
  const sendImageMutation = useMutation(api.messaging.sendImageMessage);
  const generateUploadUrlMutation = useMutation(api.messaging.generateUploadUrl);
  const unsendMessageMutation = useMutation(api.messaging.unsendMessage);
  const markAsReadMutation = useMutation(api.messaging.markMessagesAsRead);
  const acceptRequestMutation = useMutation(api.messaging.acceptConversationRequest);
  const reactToMessageMutation = useMutation(api.messaging.reactToMessage);

  useEffect(() => {
    markAsReadMutation();
  }, []);

  const handleAcceptRequest = async () => {
    try {
      await acceptRequestMutation({ conversationId: conversationId as string });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const blockUserMutation = useMutation(api.moderation.blockUser);
  const blockedUsers = useQuery(api.moderation.getBlockedUsers);
  const isBlocked = !!(
    otherUser?._id && blockedUsers?.some((b) => b.userId === otherUser._id)
  );

  const handleToggleBlock = () => {
    if (!otherUser?._id) return;
    if (currentUser && otherUser._id === currentUser._id) return;

    const name = otherUser.username || 'this user';
    Alert.alert(
      isBlocked ? `Unblock @${name}?` : `Block @${name}?`,
      isBlocked
        ? 'They will be able to interact with you again.'
        : "They won't be able to interact with you.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const result = await blockUserMutation({
                blockedUserId: otherUser._id,
              });
              Alert.alert(
                result.action === 'blocked' ? 'User Blocked' : 'User Unblocked',
                result.action === 'blocked'
                  ? `@${name} has been blocked.`
                  : `@${name} has been unblocked.`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update block.');
            }
          },
        },
      ]
    );
  };

  const handleSendPress = async () => {
    if (isSending) return;

    if (selectedImage && selectedImageAsset) {
      await sendImage();
    } else if (messageText.trim()) {
      await sendTextMessage();
    }
  };

  const sendTextMessage = async () => {
    try {
      setIsSending(true);
      await sendMessageMutation({
        conversationId: conversationId as string,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const sendImage = async () => {
    try {
      setIsSending(true);

      const uploadUrl = await generateUploadUrlMutation();
      const response = await fetch(selectedImage!);
      const blob = await response.blob();

      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': selectedImageAsset.mimeType || 'image/jpeg' },
        body: blob,
      });

      const json = await uploadResult.json();
      const storageId = json.storageId;

      await sendImageMutation({
        conversationId: conversationId as string,
        imageStorageId: storageId,
      });

      setSelectedImage(null);
      setSelectedImageAsset(null);
      setIsImagePickerOpen(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send image');
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need media library access to send images!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedImageAsset(result.assets[0]);
      setIsImagePickerOpen(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedImageAsset(result.assets[0]);
      setIsImagePickerOpen(false);
    }
  };

  const handleUnsendMessage = (messageId: string) => {
    Alert.alert(
      'Unsend Message',
      'This will remove the message for both participants. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: async () => {
            try {
              await unsendMessageMutation({ messageId: messageId as any });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unsend message');
            }
          },
        },
      ]
    );
  };

  const handleReact = (message: any, emoji: string) => {
    if (!message) return;
    setActionMessage(null);
    reactToMessageMutation({ messageId: message._id, emoji }).catch((err: any) => {
      Alert.alert('Error', err.message || 'Failed to add reaction');
    });
  };

  const handleCopyMessage = () => {
    if (!actionMessage?.content) return;
    Clipboard.setString(actionMessage.content);
    setActionMessage(null);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isFromMe = item.senderId === currentUser?._id;
    const canUnsend = isFromMe && !item.isUnsent;

    if (item.isUnsent) {
      return (
        <View style={styles.unsentMessageContainer}>
          <Text style={styles.unsentText}>Message unsent</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isFromMe ? styles.myMessageContainer : styles.theirMessage,
        ]}
      >
        {!isFromMe && item.sender && (
          <View style={styles.messageHeader}>
            <Image
              source={{ uri: item.sender.profilePicture }}
              style={styles.senderAvatar}
            />
            <Text style={styles.senderName}>
              {item.sender.name || item.sender.username}
            </Text>
          </View>
        )}

        {item.imageStorageId ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              setViewingImageUrl(messageImages[item.imageStorageId] || item.imageStorageId)
            }
            onLongPress={() => setActionMessage(item)}
          >
            <View style={styles.imageMessageContainer}>
              <Image
                source={{ uri: messageImages[item.imageStorageId] || item.imageStorageId }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setActionMessage(item)}
          >
            <View style={[styles.textMessageContainer, isFromMe && styles.myMessageTextContainer]}>
              <Text style={[styles.messageText, isFromMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.content}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatTimestamp(item.createdAt)}
          </Text>
          {canUnsend && (
            <TouchableOpacity
              style={styles.unsendButton}
              onPress={() => handleUnsendMessage(item._id)}
            >
              <Ionicons name="trash-outline" size={12} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>

        {item.reactions && Object.keys(item.reactions).length > 0 && (
          <View style={styles.reactionsRow}>
            {Object.entries(
              Object.values(item.reactions as Record<string, string>).reduce((counts: Record<string, number>, emoji) => {
                counts[emoji] = (counts[emoji] || 0) + 1;
                return counts;
              }, {})
            ).map(([emoji, count]) => {
              const isMine = Boolean(currentUser && item.reactions?.[currentUser._id] === emoji);
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.reactionPill, isMine && styles.reactionPillMine]}
                  onPress={() => handleReact(item, emoji)}
                >
                  <Text style={styles.reactionText}>
                    {emoji}{count > 1 ? ` ${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const otherUserName = otherUser?.name || otherUser?.username || 'User';

  return (
    <SafeAreaView
      style={styles.container}
      edges={Platform.OS === 'ios' && keyboardHeight > 0 ? ["top"] : ["top", "bottom"]}
    >
      <View
        style={[
          styles.container,
          Platform.OS === 'ios' && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
        ]}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitle: () => (
              <TouchableOpacity
                style={styles.headerTitleButton}
                onPress={() =>
                  router.push({
                    pathname: '/chat-info/[conversationId]' as any,
                    params: {
                      conversationId: conversationId as string,
                      otherUserId: otherUserId as string,
                    },
                  } as any)
                }
              >
                <Text style={styles.headerTitleText} numberOfLines={1}>
                  {otherUserName}
                </Text>
                <Ionicons name="chevron-forward" size={15} color="#6B7280" />
              </TouchableOpacity>
            ),
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={styles.headerActions}>
                {otherUserId && (
                  <ReportButton reportedUserId={otherUserId as string} size={20} />
                )}
                <TouchableOpacity
                  onPress={handleToggleBlock}
                  style={styles.headerActionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="ban-outline"
                    size={20}
                    color={isBlocked ? '#DC2626' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImagePreviewButton}
              onPress={() => {
                setSelectedImage(null);
                setSelectedImageAsset(null);
              }}
            >
              <Ionicons name="close-circle" size={24} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}

        {requestState?.isPendingRequest && !isBlocked && (
          <View style={styles.requestBanner}>
            <View style={styles.requestBannerTextContainer}>
              <Text style={styles.requestBannerTitle}>Message request</Text>
              <Text style={styles.requestBannerSubtitle}>
                Accept or reply to move this chat out of Requests.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.acceptRequestButton}
              onPress={handleAcceptRequest}
            >
              <Text style={styles.acceptRequestButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {isBlocked ? (
          <View style={styles.blockedNoticeContainer}>
            <Ionicons name="ban-outline" size={18} color="#6B7280" />
            <Text style={styles.blockedNoticeText}>
              You blocked this user. Unblock to send messages.
            </Text>
            <TouchableOpacity onPress={handleToggleBlock}>
              <Text style={styles.blockedNoticeAction}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setIsImagePickerOpen(true)}
            >
              <Ionicons name="add-circle-outline" size={28} color="#6c3b3b" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, (!messageText.trim() && !selectedImage) && styles.sendButtonDisabled]}
              onPress={handleSendPress}
              disabled={isSending || (!messageText.trim() && !selectedImage)}
            >
              {isSending ? (
                <ActivityIndicator size={20} color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={selectedImage ? "image-outline" : "send"}
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Image Picker Modal */}
        <Modal
          visible={isImagePickerOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsImagePickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imagePickerModal}>
              <Text style={styles.modalTitle}>Send Image</Text>

              <TouchableOpacity style={styles.imagePickerOption} onPress={pickImage}>
                <Ionicons name="image-outline" size={28} color="#6c3b3b" />
                <Text style={styles.imagePickerText}>Choose from Library</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={28} color="#6c3b3b" />
                <Text style={styles.imagePickerText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imagePickerOption, styles.cancelOption]}
                onPress={() => setIsImagePickerOpen(false)}
              >
                <Text style={[styles.imagePickerText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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

        {/* Message action sheet — emoji reply / copy / unsend */}
        <Modal
          visible={!!actionMessage}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActionMessage(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActionMessage(null)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.actionSheet}>
              <View style={styles.emojiRow}>
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiButton}
                    onPress={() => handleReact(actionMessage, emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {actionMessage && !actionMessage.imageStorageId && (
                <TouchableOpacity style={styles.actionSheetOption} onPress={handleCopyMessage}>
                  <Ionicons name="copy-outline" size={22} color="#1F2937" />
                  <Text style={styles.actionSheetOptionText}>Copy</Text>
                </TouchableOpacity>
              )}

              {actionMessage && actionMessage.senderId === currentUser?._id && (
                <TouchableOpacity
                  style={styles.actionSheetOption}
                  onPress={() => {
                    const messageId = actionMessage._id;
                    setActionMessage(null);
                    handleUnsendMessage(messageId);
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color="#DC2626" />
                  <Text style={[styles.actionSheetOptionText, styles.actionSheetDestructive]}>
                    Unsend
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionSheetOption, styles.cancelOption]}
                onPress={() => setActionMessage(null)}
              >
                <Text style={[styles.actionSheetOptionText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 230,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    maxWidth: 200,
  },
  headerActionButton: {
    padding: 4,
  },
  blockedNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  blockedNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  blockedNoticeAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6c3b3b',
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  requestBannerTextContainer: {
    flex: 1,
  },
  requestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  requestBannerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  acceptRequestButton: {
    backgroundColor: '#6c3b3b',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  textMessageContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  myMessageTextContainer: {
    backgroundColor: '#6c3b3b',
    borderWidth: 0,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1F2937',
  },
  imageMessageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageImage: {
    width: 200,
    height: 150,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unsendButton: {
    marginLeft: 8,
    padding: 2,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reactionPillMine: {
    borderColor: '#6c3b3b',
    backgroundColor: '#F9F1F1',
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
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
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 40,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  emojiButton: {
    padding: 6,
  },
  emojiText: {
    fontSize: 30,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionSheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSheetDestructive: {
    color: '#DC2626',
  },
  unsentMessageContainer: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unsentText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12, // Provides clear padding above home bar indicator
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    padding: 4,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6c3b3b',
    borderRadius: 20,
    padding: 10,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImagePreviewButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelText: {
    color: '#6B7280',
    textAlign: 'center',
    marginLeft: 0,
  },
});