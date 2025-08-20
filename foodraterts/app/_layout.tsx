import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
    return (
        <Drawer screenOptions={{ headerShown: false }}
                drawerPosition= "right">
            <Drawer.Screen 
                name="(tabs)" // This routes to your existing tab navigator
                options={{ 
                    title: 'Main App',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="apps-outline" size={size} color={color} />
                    ),
                }}
            />
            {/* You can add more drawer screens here, like profileSettings */}
            <Drawer.Screen
                name="profileSettings"
                options={{
                    title: 'Settings',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer>
    );
}