import React from "react";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";

type BookmarkTarget = "restaurant" | "review" | "tweet";

type Props = {
  targetType: BookmarkTarget;
  targetId: string;
  size?: number;
  color?: string;
  activeColor?: string;
};

export function BookmarkButton({
  targetType,
  targetId,
  size = 20,
  color = "#6B7280",
  activeColor = "#6c3b3b",
}: Props) {
  const currentUser = useQuery(api.users.viewer);
  const isBookmarked = useQuery(
    api.bookmarks.isBookmarked,
    currentUser ? { targetType, targetId } : "skip"
  ) ?? false;
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);
  const router = useRouter();

  const handlePress = async () => {
    if (!currentUser) {
      Alert.alert(
        "Sign in required",
        "You need to sign in to bookmark content.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/") }
        ]
      );
      return;
    }

    try {
      await toggleBookmark({ targetType, targetId });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to toggle bookmark");
    }
  };

  const iconName = isBookmarked ? "bookmark" : "bookmark-outline";
  const iconColor = isBookmarked ? activeColor : color;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={iconName} size={size} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});