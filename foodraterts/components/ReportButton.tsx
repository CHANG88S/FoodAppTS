import React, { useState } from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { ReportModal } from './ReportModal';

type ContentProps = {
  contentType: 'review' | 'tweet' | 'comment';
  contentId: string;
  ownerId?: string;
  size?: number;
};

type UserProps = {
  reportedUserId: string;
  size?: number;
};

type Props = ContentProps | UserProps;

export function ReportButton(props: Props) {
  const router = useRouter();
  const currentUser = useQuery(api.users.viewer);
  const [modalVisible, setModalVisible] = useState(false);

  const isContentProps = (p: Props): p is ContentProps =>
    'contentType' in p && 'contentId' in p;

  const handlePress = () => {
    // Check if user is trying to report their own content
    if (isContentProps(props) && props.ownerId) {
      if (props.ownerId === currentUser?._id) {
        Alert.alert("Cannot Report", "You cannot report your own content.");
        return;
      }
    }

    // For user reports, check if trying to report yourself
    if (!isContentProps(props)) {
      if (props.reportedUserId === currentUser?._id) {
        Alert.alert("Cannot Report", "You cannot report yourself.");
        return;
      }
    }

    // For content reports, we need to check if user is authenticated
    if (isContentProps(props)) {
      setModalVisible(true);
    } else {
      // For user reports, just open the modal
      setModalVisible(true);
    }
  };

  if (isContentProps(props)) {
    const { contentType, contentId, ownerId, size = 18 } = props;

    return (
      <>
        <TouchableOpacity onPress={handlePress} style={styles.button} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="flag-outline" size={size} color="#6B7280" />
        </TouchableOpacity>
        <ReportModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          mode="content"
          contentType={contentType}
          contentId={contentId}
        />
      </>
    );
  } else {
    const { reportedUserId, size = 18 } = props;

    return (
      <>
        <TouchableOpacity onPress={handlePress} style={styles.button} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="flag-outline" size={size} color="#6B7280" />
        </TouchableOpacity>
        <ReportModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          mode="user"
          reportedUserId={reportedUserId}
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});