import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
// Use the official Convex Auth hook for React Native clients
import { useAuthActions } from "@convex-dev/auth/react";

const LoginIndex = () => {  
  const router = useRouter();
  const { signIn } = useAuthActions(); // Convex hook handles both signing in AND signing up
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle User Sign In with Convex Auth
  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill out all fields.");
    
    setLoading(true);
    try {
      // Convex Auth uses standard provider strings. "password" is for traditional email/pass
      await signIn("password", { email, password, flow: "signIn" });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Sign In Failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle User Registration with Convex Auth
  const handleSignUp = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill out all fields.");

    setLoading(true);
    try {
      // Swapping the flow string to "signUp" tells Convex to generate a new user document
      await signIn("password", { email, password, flow: "signUp" });
      
      Alert.alert(
        'Account Created!', 
        'Welcome to FoodRater!',
        [{ text: 'Get Started', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert('Registration Failed', error.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FoodRater</Text>
      
      <TextInput 
        style={styles.textInput} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TextInput 
        style={styles.textInput} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.text}>{loading ? "Connecting..." : "Login"}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.signUpButton, loading && styles.disabledButton]} 
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.text}>Make Account</Text>
      </TouchableOpacity>
      
      <Link href="/(tabs)/home" style={styles.skipText}>
        Skip for now
      </Link>
    </SafeAreaView>
  );
};

export default LoginIndex;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA', 
  },
  title: {
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: 40, 
    color: '#6c3b3b', 
    letterSpacing: 0.5,
  },
  textInput: {
    height: 50, 
    width: '90%', 
    backgroundColor: '#FFFFFF', 
    borderColor: '#E8EAF6', 
    borderWidth: 2,
    borderRadius: 15, 
    marginVertical: 10,
    paddingHorizontal: 20, 
    fontSize: 16, 
    color: '#3C4858', 
    shadowColor: '#9E9E9E', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, 
  },
  button: {
    width: '90%',
    marginVertical: 10,
    backgroundColor: '#6c3b3b', 
    padding: 16,
    borderRadius: 15, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c3b3b', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButton: {
    backgroundColor: '#4B5563', 
    shadowColor: '#4B5563',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
  },
  skipText: {
    marginTop: 20,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});