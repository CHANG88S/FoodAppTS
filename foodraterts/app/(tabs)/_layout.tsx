import React from 'react';
import { Tabs, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import BadgesScreen from '../badges';
import SettingsScreen from '../settings';
import AccountSettingsScreen from '../account-settings';
import BobaPreferencesScreen from '../boba-preferences';

const Drawer = createDrawerNavigator();

function TabLayout() {
    const unreadCount = useQuery(api.notifications.getUnreadCount);

    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case "home":
                            iconName = focused ? "home" : "home-outline";
                            break;
                        case "search":
                            iconName = focused ? "search" : "search-outline";
                            break;
                        case "notification":
                            iconName = focused ? "heart" : "heart-outline";
                            break;
                        case "profile":
                            iconName = focused ? "person" : "person-outline";
                            break;
                        default:
                            iconName = "ellipse";
                    }

                    const showBadge = route.name === "notification" && typeof unreadCount === "number" && unreadCount > 0;

                    return (
                        <View style={{ position: 'relative' }}>
                            <Ionicons name={iconName} size={24} color={color} />
                            {showBadge && (
                                <View style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    backgroundColor: '#b01212',
                                    borderRadius: 10,
                                    minWidth: 18,
                                    height: 18,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingHorizontal: 4,
                                }}>
                                    <Text style={{
                                        color: '#fff',
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                },
                tabBarActiveTintColor: "#000000",
                tabBarInactiveTintColor: "#000000",
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    position: "absolute",
                    bottom: 30,
                    marginHorizontal: 40,
                    height: 54,
                    borderRadius: 27,
                    borderTopWidth: 0.5,
                    borderTopColor: "rgba(0, 0, 0, 0.1)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 5,
                    paddingBottom: 6,
                    paddingTop: 6,
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

function CustomDrawerContent(props: any) {
    const { signOut } = useAuthActions();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/');
        } catch (error: any) {
            console.error(error);
        }
    };

    return (
        <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem 
                label="Sign Out"
                icon={({ size }) => (
                    <Ionicons name="log-out-outline" size={size} color="#b01212" />
                )}
                labelStyle={{ color: '#b01212', fontWeight: '600' }}
                onPress={handleSignOut}
            />
        </DrawerContentScrollView>
    );
}

export default function TabsDrawerLayout() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerPosition: 'right',
                drawerType: 'front',
                drawerStyle: {
                    width: 260,
                },
            }}
        >
            <Drawer.Screen 
                name="mainTabs" 
                component={TabLayout} 
                options={{ drawerItemStyle: { display: 'none' } }} 
            />

            <Drawer.Screen
                name="settings"
                component={SettingsScreen}
                options={{
                    title: "Profile Settings",
                    drawerLabel: () => <Text style={{ fontSize: 15, fontWeight: '500' }}>Profile Settings</Text>,
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="badges"
                component={BadgesScreen}
                options={{
                    title: "Badges & Achievements",
                    drawerLabel: () => <Text style={{ fontSize: 15, fontWeight: '500' }}>Badges & Achievements</Text>,
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="trophy-outline" size={size} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="account-settings"
                component={AccountSettingsScreen}
                options={{
                    title: "Account Settings",
                    drawerLabel: () => <Text style={{ fontSize: 15, fontWeight: '500' }}>Account Settings</Text>,
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name="boba-preferences"
                component={BobaPreferencesScreen}
                options={{
                    title: "Boba Preferences",
                    drawerLabel: () => <Text style={{ fontSize: 15, fontWeight: '500' }}>Boba Preferences</Text>,
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="cafe-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}