import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import Mapbox from '@rnmapbox/maps';

SplashScreen.preventAutoHideAsync();

const secureStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }

    // Set Mapbox access token
    Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="restaurant/[id]" 
          options={{ 
            title: "Restaurant Details", 
            headerTintColor: "#6C3B3B", 
            headerStyle: { backgroundColor: "#FAFAF9" },
            headerBackTitle: "Back",
            headerShadowVisible: false,
          }} 
        />
      </Stack>
    </ConvexAuthProvider>
  );
}