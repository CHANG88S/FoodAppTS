import { Stack } from "expo-router";


export default function RootLayout () {

    const isLogin = true;

    return (
        <Stack>
          <Stack.Screen 
          name = "(tabs)" // having (tabs) in the name allows it not to be displayed in the header
          options=
            {{ headerShown: false }}/>
        </Stack>
    );
};
