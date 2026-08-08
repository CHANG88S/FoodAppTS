import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { Id, Doc } from "../../convex/_generated/dataModel";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

// Simple relative time formatter
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

type Notification = Doc<"notifications"> & {
  sender?: any;
};

export default function NotificationScreen() {
  const router = useRouter();

  const notifications = useQuery(api.notifications.listNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: Id<"notifications">) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead({ notificationId: notification._id });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }

    switch (notification.type) {
      case "follow":
        if (notification.sender) {
          router.push(`/user/${notification.sender.username}` as any);
        }
        break;
      case "like":
      case "comment":
        if (notification.targetType === "tweet" && notification.targetId) {
          router.push(`/social/${notification.targetId}` as any);
        } else if (notification.targetType === "review" && notification.targetId) {
          router.push(`/restaurant/rate/${notification.targetId}` as any);
        }
        break;
      case "mention":
        if (notification.targetId) {
          router.push(`/social/${notification.targetId}` as any);
        }
        break;
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const senderName = notification.sender?.name || notification.sender?.username || "Someone";

    switch (notification.type) {
      case "follow":
        return `${senderName} started following you`;
      case "like":
        if (notification.targetType === "tweet") {
          return `${senderName} liked your tweet`;
        } else {
          return `${senderName} liked your review`;
        }
      case "comment":
        if (notification.targetType === "tweet") {
          return `${senderName} commented on your tweet`;
        } else {
          return `${senderName} commented on your review`;
        }
      case "mention":
        return `${senderName} mentioned you`;
      default:
        return "New notification";
    }
  };

  const renderSwipeableRow = (notification: Notification) => {
    const renderRightActions = () => (
      <View style={styles.swipeDelete}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(notification._id)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          onPress={() => handleNotificationPress(notification)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.notificationCard,
              !notification.isRead && styles.unreadCard,
            ]}
          >
            <View style={styles.avatarContainer}>
              <ProfileAvatar
                storageId={notification.sender?.profilePicture}
                size={48}
                variant="brand"
                fallbackText={notification.sender?.name || notification.sender?.username || "?"}
                style={styles.avatar}
              />
              <View style={[styles.iconBadge, getIconBadgeStyle(notification.type)]}>
                <Ionicons
                  name={getIconName(notification.type)}
                  size={12}
                  color="#fff"
                />
              </View>
            </View>

            <View style={styles.notificationContent}>
              <Text style={styles.notificationText} numberOfLines={2}>
                {getNotificationText(notification)}
              </Text>

              {notification.type === "comment" && 
               typeof notification.message === "string" && 
               notification.message.trim().length > 0 && (
                <Text style={styles.commentPreview} numberOfLines={1}>
                  "{notification.message}"
                </Text>
              )}

              <Text style={styles.timestamp}>
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </View>

            {!notification.isRead && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const groupNotifications = (notifs: Notification[] | undefined) => {
    if (!notifs || notifs.length === 0) {
      return {};
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 2 * oneDay;

    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    notifs.forEach((notification) => {
      const timeDiff = now - notification.createdAt;

      if (timeDiff < oneDay) {
        groups.Today.push(notification);
      } else if (timeDiff < twoDays) {
        groups.Yesterday.push(notification);
      } else {
        groups.Older.push(notification);
      }
    });

    return groups;
  };

  const getIconName = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "follow":
        return "person-add";
      case "like":
        return "heart";
      case "comment":
        return "chatbubble";
      case "mention":
        return "at";
      default:
        return "notifications";
    }
  };

  const getIconBadgeStyle = (type: string) => {
    switch (type) {
      case "follow":
        return styles.badgeFollow;
      case "like":
        return styles.badgeLike;
      case "comment":
        return styles.badgeComment;
      case "mention":
        return styles.badgeMention;
      default:
        return styles.badgeDefault;
    }
  };

  const groupedNotifications = groupNotifications(notifications);

  const renderSection = (title: string, items: Notification[]) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((notification) => (
          <View key={notification._id}>{renderSwipeableRow(notification)}</View>
        ))}
      </View>
    );
  };

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasNotifications && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={!hasNotifications ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {hasNotifications ? (
          <>
            {renderSection("Today", groupedNotifications.Today || [])}
            {renderSection("Yesterday", groupedNotifications.Yesterday || [])}
            {renderSection("Older", groupedNotifications.Older || [])}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              When someone interacts with your posts, you'll see it here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#6c3b3b",
    borderRadius: 16,
  },
  markAllReadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  unreadCard: {
    backgroundColor: "#fafafa",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: "#6c3b3b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeFollow: {
    backgroundColor: "#4CAF50",
  },
  badgeLike: {
    backgroundColor: "#E91E63",
  },
  badgeComment: {
    backgroundColor: "#2196F3",
  },
  badgeMention: {
    backgroundColor: "#FF9800",
  },
  badgeDefault: {
    backgroundColor: "#9E9E9E",
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    color: "#000",
  },
  commentPreview: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6c3b3b",
    marginLeft: 8,
  },
  swipeDelete: {
    width: 80,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});