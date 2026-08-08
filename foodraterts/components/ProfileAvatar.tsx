import React from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

type ProfileAvatarProps = {
  /**
   * The user's stored `profilePicture` value — a Convex storage id (the normal
   * case) or an http(s) URL, which `getPublicUrl` passes through untouched.
   */
  storageId?: string | null;
  /** Avatar diameter in px. */
  size?: number;
  /**
   * "light" = gray background + brown initial (own/public profile + tweet avatars);
   * "brand" = brown background + white text (search results + notifications).
   */
  variant?: "light" | "brand";
  /** Text the fallback initial is derived from. */
  fallbackText?: string;
  /** Extra container styling (border, margin, etc.). */
  style?: object;
  /** Show a spinner overlay (e.g. while uploading). */
  uploading?: boolean;
};

/**
 * Resolves a stored profile-picture storage id to a signed URL and renders the
 * avatar (image or initial fallback). Safe to use inside lists — each instance
 * owns its own `useQuery`, so it works per-row.
 */
export function ProfileAvatar({
  storageId,
  size = 40,
  variant = "light",
  fallbackText = "U",
  style,
  uploading = false,
}: ProfileAvatarProps) {
  const url = useQuery(
    api.images.getPublicUrl,
    storageId ? { storageId } : "skip"
  );

  const radius = size / 2;
  const isBrand = variant === "brand";

  return (
    <View style={[{ width: size, height: size, borderRadius: radius }, style]}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isBrand ? "#6c3b3b" : "#E5E7EB",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text
            style={{
              color: isBrand ? "#FFFFFF" : "#6c3b3b",
              fontSize: Math.round(size * 0.4),
              fontWeight: "700",
            }}
          >
            {fallbackText.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {uploading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.45)",
              borderRadius: radius,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <ActivityIndicator color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}
