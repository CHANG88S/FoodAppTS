import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { formatTimestamp } from '../../utils/formatters';

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, otherUserId } = useLocalSearchParams();
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAsset, setSelectedImageAsset] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const messages = useQuery(api.messaging.getMessages, {
    conversationId: conversationId as string,
  }) || [];

  const currentUser = useQuery(api.users.viewer);
  const otherUser = useQuery(api.users.getUser, {
    userId: otherUserId as string,
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

  useEffect(() => {
    markAsReadMutation();
  }, []);

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
      allowsEditing: true,
      aspect: [4, 3],
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
      allowsEditing: true,
      aspect: [4, 3],
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
          <View style={styles.imageMessageContainer}>
            <Image
              source={{ uri: messageImages[item.imageStorageId] || item.imageStorageId }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.textMessageContainer, isFromMe && styles.myMessageTextContainer]}>
            <Text style={[styles.messageText, isFromMe ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          </View>
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
      </View>
    );
  };

  const otherUserName = otherUser?.name || otherUser?.username || 'User';

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: otherUserName,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#1F2937', fontWeight: '700' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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