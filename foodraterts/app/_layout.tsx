import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import React from "react";
import * as SecureStore from "expo-secure-store";

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
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <Stack>
        {/* Auth / Splash Landing Gate */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
        {/* Main Tab Controller (Houses Home, Search, Upload, etc.) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* 🔥 ADD THIS ROUTE: Handles the sliding stack sheet for individual shops */}
        <Stack.Screen 
          name="restaurant/[id]" 
          options={{ 
            title: "Restaurant Details", 
            headerTintColor: "#6C3B3B",        // Clean brand tint color matching FoodRater
            headerStyle: { backgroundColor: "#FAFAF9" }, // Stone-50 background look
            headerBackTitle: "Back",
            headerShadowVisible: false,       // Keeps header transition looking premium and flat
          }} 
        />
      </Stack>
    </ConvexAuthProvider>
  );
}