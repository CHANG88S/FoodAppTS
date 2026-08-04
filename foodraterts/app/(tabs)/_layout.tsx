import React from 'react';
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { 
    createDrawerNavigator, 
    DrawerContentScrollView, 
    DrawerItemList, 
    DrawerItem 
} from '@react-navigation/drawer';
import { useAuthActions } from '@convex-dev/auth/react';
import BadgesScreen from '../badges';
import SettingsScreen from '../settings';

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

// 🔑 Custom Drawer Content to include Sign Out
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
                icon={({ color, size }) => (
                    <Ionicons name="log-out-outline" size={size} color="#b01212" />
                )}
                labelStyle={{ color: '#b01212', fontWeight: '600' }}
                onPress={handleSignOut}
            />
        </DrawerContentScrollView>
    );
}

export default function RootLayout() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />} // 🔑 Pass the custom drawer
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
                name="Profile Settings" 
                component={SettingsScreen} 
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
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