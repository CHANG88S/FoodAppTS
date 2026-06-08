import { ConvexReactClient } from "convex/react";
// 1. Swap the import to use the official Auth Provider wrapper
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import React from "react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    // 2. Change ConvexProvider to ConvexAuthProvider
    <ConvexAuthProvider client={convex}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ConvexAuthProvider>
  );
}