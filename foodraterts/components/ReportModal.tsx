import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  mode: 'content' | 'user';
  contentType?: 'review' | 'tweet' | 'comment';
  contentId?: string;
  reportedUserId?: string;
  reportedName?: string;
};

const CONTENT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'fake_review', label: 'Fake review' },
  { value: 'other', label: 'Something else' },
];

const USER_REASONS = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'fake_account', label: 'Fake account' },
  { value: 'other', label: 'Something else' },
];

export function ReportModal({
  visible,
  onClose,
  mode,
  contentType,
  contentId,
  reportedUserId,
  reportedName,
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flagContent = useMutation(api.moderation.flagContent);
  const reportUser = useMutation(api.moderation.reportUser);

  const reasons = mode === 'content' ? CONTENT_REASONS : USER_REASONS;

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Reason Required', 'Please select a reason for the report.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'content' && contentType && contentId) {
        const result = await flagContent({
          contentType,
          contentId,
          reason: selectedReason as any,
          description: description.trim() || undefined,
        });

        if (result.duplicate) {
          Alert.alert('Already Reported', 'You have already reported this content.');
        } else {
          Alert.alert('Thanks!', 'Your report has been submitted to our moderators.');
        }
      } else if (mode === 'user' && reportedUserId) {
        await reportUser({
          reportedUserId,
          reason: selectedReason as any,
          description: description.trim() || undefined,
        });
        Alert.alert('Thanks!', 'Your report has been submitted to our moderators.');
      }

      // Reset form and close
      setSelectedReason(null);
      setDescription('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="flag-outline" size={24} color="#DC2626" />
            <Text style={styles.modalTitle}>
              {mode === 'content' ? 'Report Content' : 'Report User'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {reportedName && mode === 'user' && (
            <Text style={styles.reportedUserText}>
              Reporting: {reportedName}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Reason for report</Text>
          <ScrollView style={styles.reasonsContainer} nestedScrollEnabled>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.value && styles.selectedReason,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.value && styles.selectedReasonText,
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.value && (
                  <Ionicons name="checkmark-circle" size={20} color="#6c3b3b" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Description (optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add more details..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  reportedUserText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  reasonsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedReason: {
    borderColor: '#6c3b3b',
    backgroundColor: '#F9FAFB',
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedReasonText: {
    color: '#6c3b3b',
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#374151',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#DC2626',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});