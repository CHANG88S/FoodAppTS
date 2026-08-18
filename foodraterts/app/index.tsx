import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";

const LoginIndex = () => {  
  const router = useRouter();
  const { signIn, signOut } = useAuthActions(); 
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Track submission attempt and field interactions
  const [submitted, setSubmitted] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const hasMinUsername = username.length >= 3;
  const hasMinPassword = password.length >= 8;

  // Form validation state
  const isFormValid = () => {
    if (isSignUpMode) {
      return isValidEmail(email) && hasMinUsername && hasMinPassword;
    }
    return isValidEmail(email) && hasMinPassword;
  };

  const handleAuthAction = async () => {
    setSubmitted(true);

    if (!email || !password || (isSignUpMode && !username)) {
      return Alert.alert("Error", "Please fill out all required fields, including a username.");
    }

    if (!isValidEmail(email)) {
      return Alert.alert("Error", "Please enter a valid email address.");
    }

    if (isSignUpMode && !hasMinUsername) {
      return Alert.alert("Error", "Username must be at least 3 characters long.");
    }

    if (!hasMinPassword) {
      return Alert.alert("Error", "Password must be at least 8 characters long.");
    }

    setLoading(true);
    try {
      // First sign out any existing session to clear cached credentials
      try {
        await signOut();
      } catch (e) {
        // Ignore errors if already signed out
        console.log("No existing session to sign out");
      }

      // Small delay to ensure the sign out is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      if (isSignUpMode) {
        await signIn("password", { email, password, username, name, flow: "signUp" });
        Alert.alert('Account Created!', 'Welcome to FoodRater!');
        // New users go through onboarding
        router.replace('/onboarding');
      } else {
        await signIn("password", { email, password, flow: "signIn" });
        // Existing users check if they need onboarding
        router.replace('/onboarding'); // Will redirect to home if already completed
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Authentication Failed', error.message || 'Invalid credentials or network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setLoading(true);
    try {
      // Sign out any existing session first
      try {
        await signOut();
      } catch (e) {
        // Ignore errors if already signed out
        console.log("No existing session to sign out");
      }

      // Small delay to ensure sign out is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error("Guest access error:", error);
      // Still allow guest access even if sign out fails
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setUsername("");
    setName("");
    setEmail("");
    setPassword("");
    setSubmitted(false);
    setUsernameTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FoodRater</Text>
      
      {isSignUpMode && (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Username (min. 3 characters)"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (submitted) setSubmitted(false);
                if (!usernameTouched) setUsernameTouched(true);
              }}
              autoCapitalize="none"
              editable={!loading}
            />
            {username.length > 0 && (
              <Text style={[
                styles.charCount,
                hasMinUsername ? styles.validCharCount : styles.invalidCharCount
              ]}>
                {username.length}/3
              </Text>
            )}
          </View>

          {username.length > 0 && (
            <View style={styles.constraintsBox}>
              <Text style={[styles.constraintText, hasMinUsername ? styles.validText : styles.invalidText]}>
                {hasMinUsername ? '✓' : '•'} At least 3 characters
              </Text>
            </View>
          )}

          {(usernameTouched && !hasMinUsername) && (
            <Text style={styles.errorText}>Username must be at least 3 characters long</Text>
          )}

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
        placeholder="Email address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (submitted) setSubmitted(false);
          if (!emailTouched) setEmailTouched(true);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      {email.length > 0 && !isValidEmail(email) && (
        <Text style={styles.errorText}>Please enter a valid email address</Text>
      )}
      {(emailTouched && !isValidEmail(email) && email.length === 0) && (
        <Text style={styles.errorText}>Email is required</Text>
      )}
      
      <TextInput 
        style={styles.textInput} 
        placeholder="Password" 
        value={password} 
        onChangeText={(text) => {
          setPassword(text);
          if (submitted) setSubmitted(false);
          if (!passwordTouched) setPasswordTouched(true);
        }} 
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />
      
      {password.length > 0 && (
        <View style={styles.constraintsBox}>
          <Text style={[styles.constraintText, hasMinPassword ? styles.validText : styles.invalidText]}>
            {hasMinPassword ? '✓' : '•'} At least 8 characters
          </Text>
        </View>
      )}

      {(passwordTouched && !hasMinPassword && password.length > 0) && (
        <Text style={styles.errorText}>Password must be at least 8 characters long</Text>
      )}
      
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton, !isFormValid() && styles.disabledButton]}
        onPress={handleAuthAction}
        disabled={loading || !isFormValid()}
      >
        <Text style={styles.text}>
          {loading ? "Processing..." : isSignUpMode ? "Create Account" : "Login"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={handleToggleMode}
      >
        <Text style={styles.switchModeText}>
          {isSignUpMode ? "Already have an account? Login" : "Need an account? Sign Up"}
        </Text>
      </TouchableOpacity>

      <View style={styles.termsRow}>
        <Text style={styles.termsText}>By continuing, you agree to our </Text>
        <TouchableOpacity onPress={() => router.push('/terms')}>
          <Text style={styles.termsLink}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}> and </Text>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleContinueAsGuest}>
        <Text style={styles.skipText}>Continue as Guest</Text>
      </TouchableOpacity>
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
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EAF6',
    borderWidth: 2,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 20,
    paddingRight: 50, // Extra space for character counter
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  errorText: {
    width: '90%',
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  inputContainer: {
    width: '90%',
    position: 'relative',
  },
  charCount: {
    position: 'absolute',
    right: 15,
    top: 15,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  validCharCount: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
  },
  invalidCharCount: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  constraintsBox: {
    width: '90%',
    marginTop: 6,
    marginBottom: 6,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 4,
  },
  constraintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  validText: {
    color: '#059669',
  },
  invalidText: {
    color: '#9CA3AF',
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
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop: 12,
  },
  termsText: {
    color: '#6B7280',
    fontSize: 12,
  },
  termsLink: {
    color: '#6c3b3b',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});