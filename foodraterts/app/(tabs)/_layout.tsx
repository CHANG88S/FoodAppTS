import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case "home":
                            iconName = focused ? "home" : "home-outline";
                            break;
                        case "search":
                            iconName = focused ? "search" : "search-outline";
                            break;
                        case "notification":
                            iconName = focused ? "notifications" : "notifications-outline";
                            break;
                        case "profile":
                            iconName = focused ? "person" : "person-outline";
                            break;
                        default:
                            iconName = "ellipse";
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "#6c3b3b",
                tabBarInactiveTintColor: "#9CA3AF",
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    height: 60,
                    paddingBottom: 5,
                }
            })}
        >
            <Tabs.Screen 
                name="home" 
                options={{
                    headerShown: false,
                }}
            />
            <Tabs.Screen name="search" />
            <Tabs.Screen name="notification" />
            <Tabs.Screen 
                name="profile" 
                options={{
                    headerShown: false, 
                }}
            />
        </Tabs>
    );
}