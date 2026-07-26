import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";

const LoginIndex = () => {  
  const router = useRouter();
  const { signIn } = useAuthActions(); 
  
  const [isSignUpMode, setIsSignUpMode] = useState(false); // Toggle between login & signup fields
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async () => {
    // Enforce that email, password, and username are provided during sign up
    if (!email || !password || (isSignUpMode && !username)) {
      return Alert.alert("Error", "Please fill out all required fields, including a username.");
    }
    
    setLoading(true);
    try {
      if (isSignUpMode) {
        // Pass username and optional name along with email/password to Convex Auth
        await signIn("password", { email, password, username, name, flow: "signUp" });
        Alert.alert('Account Created!', 'Welcome to FoodRater!');
      } else {
        await signIn("password", { email, password, flow: "signIn" });
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Authentication Failed', error.message || 'Invalid credentials or network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FoodRater</Text>
      
      {isSignUpMode && (
        <>
          <TextInput 
            style={styles.textInput} 
            placeholder="Username (Required)" 
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput 
            style={styles.textInput} 
            placeholder="Display Name (Optional)" 
            value={name} 
            onChangeText={setName} 
            autoCapitalize="words"
            editable={!loading}
          />
        </>
      )}

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
        onPress={handleAuthAction}
        disabled={loading}
      >
        <Text style={styles.text}>
          {loading ? "Processing..." : isSignUpMode ? "Create Account" : "Login"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.switchModeButton} 
        onPress={() => setIsSignUpMode(!isSignUpMode)}
      >
        <Text style={styles.switchModeText}>
          {isSignUpMode ? "Already have an account? Login" : "Need an account? Sign Up"}
        </Text>
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
    marginTop: 15,
    marginBottom: 10,
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
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
  },
  switchModeButton: {
    padding: 10,
  },
  switchModeText: {
    color: '#4B5563',
    fontSize: 14,
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