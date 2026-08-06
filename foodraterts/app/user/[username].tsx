import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams();

  // Get current viewer securely from backend API query
  const viewer = useQuery(api.users.viewer);
  const currentUserId = viewer?._id;

  // Get user by username
  const userProfile = useQuery(api.users.getUserByUsername, {
    username: username as string,
  });

  const followers = useQuery(
    api.users.getFollowers,
    userProfile?._id ? { userId: userProfile._id } : "skip"
  );
  const following = useQuery(
    api.users.getFollowing,
    userProfile?._id ? { userId: userProfile._id } : "skip"
  );
  const userTweets = useQuery(api.tweets.getTweetsByUserId, {
    userId: userProfile?._id ?? "",
  });

  const isFollowing = useQuery(
    api.users.isFollowing,
    userProfile?._id ? { followingId: userProfile._id } : "skip"
  );

  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);

  const handleFollow = async () => {
    if (!userProfile?._id) return;

    try {
      if (isFollowing) {
        await unfollowUser({ followingId: userProfile._id });
      } else {
        await followUser({ followingId: userProfile._id });
      }
      // Queries will automatically re-fetch
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleMessage = () => {
    // TODO: Navigate to messaging when implemented
    console.log("Navigate to messages");
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          {userProfile.profilePicture ? (
            <Image
              source={{ uri: userProfile.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={[styles.profilePicture, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(userProfile.name || userProfile.username).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={styles.username}>@{userProfile.username}</Text>
          {userProfile.name && (
            <Text style={styles.displayName}>{userProfile.name}</Text>
          )}

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statCount}>{followers?.length || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statCount}>{following?.length || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Only show follow/message buttons if not viewing own profile */}
          {currentUserId && userProfile?._id !== currentUserId && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isFollowing ? styles.secondaryButton : null,
                ]}
                onPress={handleFollow}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    isFollowing ? styles.secondaryButtonText : null,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.messageButton]}
                onPress={handleMessage}
              >
                <Ionicons name="mail-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {userTweets === undefined ? (
            <Text style={styles.emptyText}>Loading activity...</Text>
          ) : userTweets.length > 0 ? (
            userTweets.map((tweet) => (
              <View key={tweet._id} style={styles.tweetCard}>
                <Text style={styles.tweetBody}>{tweet.body}</Text>
                <Text style={styles.tweetDate}>
                  {new Date(tweet.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#999",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#6c3b3b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  displayName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e0e0e0",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#6c3b3b",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6c3b3b",
  },
  secondaryButtonText: {
    color: "#6c3b3b",
  },
  messageButton: {
    minWidth: 48,
    paddingHorizontal: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  tweetCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  tweetBody: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  tweetDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 24,
  },
});