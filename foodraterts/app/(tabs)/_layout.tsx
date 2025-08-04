import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string;
                    switch (route.name) {
                        case "home":
                            iconName = focused ? "home" : "home-outline";
                            break;
                        case "search":
                            iconName = focused ? "search" : "search-outline";
                            break;
                        case "upload":
                            iconName = focused ? "add-circle" : "add-circle-outline";
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
                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: "blue",
                tabBarInactiveTintColor: "gray",
            })}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="search" />
            <Tabs.Screen
                name="upload"
                options={{
                    headerShown: false,               // Show the header to place the X button
                    tabBarStyle: { display: 'none' }, // Hide the tab bar for this screen
                }}
            />
            <Tabs.Screen name="notification" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}