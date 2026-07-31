import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createDrawerNavigator } from '@react-navigation/drawer';
import BadgesScreen from '../badges'; // Adjust path if necessary depending on folder structure

const Drawer = createDrawerNavigator();

function TabLayout() {
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
                },
                headerShown: false,
            })}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="search" />
            <Tabs.Screen name="notification" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}

export default function RootLayout() {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerPosition: 'right', // Slides smoothly from right to left
                drawerType: 'front',
                drawerStyle: {
                    width: 260,
                },
            }}
        >
            <Drawer.Screen 
                name="mainTabs" 
                component={TabLayout} 
                options={{ drawerItemStyle: { display: 'none' } }} // Hides mainTabs from showing as a raw text link in the drawer list
            />
            <Drawer.Screen 
                name="Badges & Achievements" 
                component={BadgesScreen} 
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="trophy-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}