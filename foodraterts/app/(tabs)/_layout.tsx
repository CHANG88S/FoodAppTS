import { Tabs } from "expo-router"

export default () => {
    return (
        <Tabs>
            <Tabs.Screen name = "home"/>
            <Tabs.Screen name = "search"/>
            <Tabs.Screen name = "upload"/>
            <Tabs.Screen name = "notification"/>
            <Tabs.Screen name = "profile"/>   
        </Tabs>
    );
};    