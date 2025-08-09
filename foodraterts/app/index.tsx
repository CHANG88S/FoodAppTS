import { Link, Redirect } from "expo-router";
import { Button, View } from "react-native";

const index = () => {  
  // return <Redirect href="/(tabs)/home" />;
  return (
  <View  
    style =  {{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Link href="../register" asChild>
      {/* <Text>Welcome to FoodRaterTS!</Text> */}
      <Button title = "Register"/>        
    </Link>
    <Link href="../(tabs)/home" asChild>
       {/* <Text>Welcome to FoodRaterTS!</Text> */}
      <Button title = "Login"/>        
    </Link>
  </View>
  );
};

export default index;