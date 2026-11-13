import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProfileAvatar } from "../../components/ProfileAvatar";
import { Id } from "../../convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  username: string;
  name?: string;
  profilePicture?: string;
};

type Review = {
  _id: Id<"itemReviews">;
  itemName: string;
  restaurantName: string;
  restaurantId: Id<"restaurants"> | null;
  notes: string;
  overallRating: number;
  authorName: string;
  authorUsername: string;
  authorProfilePicture?: string;
  imageStorageId?: string;
  userId: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Get random reviews from other users for the explore feed
  const currentUser = useQuery(api.users.viewer) as any;
  const currentUserId = currentUser?._id;

  // When not searching, show random reviews from other users
  const exploreReviews = useQuery(
    api.items.getRandomReviewsFromOthers,
    currentUserId ? { excludeUserId: currentUserId, limit: 20 } : "skip"
  );

  // When searching, only search for users
  const userResults = useQuery(
    api.messaging.searchUsers,
    isSearching && searchQuery.trim() ? { searchQuery } : "skip"
  );

  const handleUserPress = (user: User) => {
    router.push(`/user/${user.username}`);
  };

  const handleReviewPress = (review: Review) => {
    if (review.restaurantId) {
      router.push(`/restaurant/${review.restaurantId}`);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(text.length > 0);
  };

  const renderContent = () => {
    if (isSearching) {
      // Show user search results
      if (searchQuery.trim() && userResults && userResults.length > 0) {
        return (
          <FlatList
            data={userResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <UserCard user={item} onPress={handleUserPress} />}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        );
      } else if (searchQuery.trim()) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>Try a different username</Text>
          </View>
        );
      }
    }

    // Show explore feed with random reviews
    if (exploreReviews && exploreReviews.length > 0) {
      return (
        <FlatList
          data={exploreReviews}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ReviewCard review={item} onPress={handleReviewPress} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="restaurant-outline" size={48} color="#ccc" />
        <Text style={styles.emptyTitle}>Explore Activity</Text>
        <Text style={styles.emptyText}>See what people are rating</Text>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(""); setIsSearching(false); }} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Area */}
      {renderContent()}
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

function UserCard({
  user,
  onPress,
}: {
  user: User;
  onPress: (user: User) => void;
}) {
  const isFollowing = useQuery(api.users.isFollowing, {
    followingId: user._id,
  });
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
          size={36}
          variant="brand"
          fallbackText={user.name || user.username}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {user.username}
          </Text>
          {user.name && (
            <Text style={styles.displayName}>{user.name}</Text>
          )}
        </View>

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
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ReviewCard({
  review,
  onPress,
}: {
  review: Review;
  onPress: (review: Review) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleUserPress = () => {
    router.push(`/user/${review.authorUsername}`);
  };

  return (
    <TouchableOpacity onPress={() => onPress(review)} activeOpacity={0.7}>
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAuthorInfo}>
            <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
              <ProfileAvatar
                storageId={review.authorProfilePicture}
                size={28}
                variant="brand"
                fallbackText={review.authorName}
                style={styles.reviewAvatar}
              />
            </TouchableOpacity>
            <View style={styles.reviewAuthorText}>
              <View style={styles.nameRow}>
                <Text style={styles.reviewAuthorName}>{review.authorName}</Text>
                <Text style={styles.reviewUsername}> @{review.authorUsername}</Text>
              </View>
              <Text style={styles.reviewMeta}>
                rated <Text style={styles.reviewItem}>{review.itemName}</Text>
              </Text>
              <Text style={styles.reviewRestaurant}>@ {review.restaurantName}</Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{review.overallRating}</Text>
          </View>
        </View>

        <Text style={styles.reviewNotes} numberOfLines={3}>
          {review.notes}
        </Text>

        {review.imageStorageId && !imageError && (
          <View style={styles.reviewImageContainer}>
            <Image
              source={{ uri: review.imageStorageId }}
              style={styles.reviewImage}
              onError={() => setImageError(true)}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  displayName: {
    fontSize: 13,
    color: "#666",
    marginTop: 1,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6c3b3b",
    minWidth: 80,
    alignItems: "center",
  },
  followButtonActive: {
    backgroundColor: "#6c3b3b",
  },
  followingButton: {
    backgroundColor: "transparent",
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  followButtonActiveText: {
    color: "#fff",
  },
  followingButtonText: {
    color: "#6c3b3b",
  },
  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewAuthorInfo: {
    flexDirection: "row",
    flex: 1,
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  reviewAuthorText: {
    flex: 1,
    minWidth: 0, // Allows text to shrink properly
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    flexShrink: 1,
  },
  reviewUsername: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    flexShrink: 1,
  },
  reviewMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  reviewItem: {
    fontWeight: "500",
  },
  reviewRestaurant: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  reviewNotes: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  reviewImageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  reviewImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 6,
    textAlign: "center",
  },
});