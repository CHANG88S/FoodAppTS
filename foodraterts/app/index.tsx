import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import * as AppleAuthentication from "expo-apple-authentication";

const LoginIndex = () => {  
  const router = useRouter();
  const { signIn, signOut } = useAuthActions(); 
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [is13OrOlder, setIs13OrOlder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  // Sign in with Apple only exists on iOS devices with the capability
  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAuthAvailable)
        .catch(() => setAppleAuthAvailable(false));
    }
  }, []);

  // Track submission attempt and field interactions
  const [submitted, setSubmitted] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const hasMinUsername = username.length >= 3;
  const hasMinPassword = password.length >= 8;

  // Check for common test email patterns
  const isTestEmail = (val: string) => {
    const testPatterns = ['test@test.com', 'admin@admin.com', 'user@user.com', 'info@test.com'];
    return testPatterns.some(pattern => val.toLowerCase() === pattern);
  };

  // Form validation state
  const isFormValid = () => {
    if (isSignUpMode) {
      return isValidEmail(email) && hasMinUsername && hasMinPassword && is13OrOlder;
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

    if (isTestEmail(email)) {
      return Alert.alert("Invalid Email", "Please use a real email address (not test@test.com, admin@admin.com, etc.). Try: yourname@gmail.com");
    }

    if (isSignUpMode && !hasMinUsername) {
      return Alert.alert("Error", "Username must be at least 3 characters long.");
    }

    if (!hasMinPassword) {
      return Alert.alert("Error", "Password must be at least 8 characters long.");
    }

    if (isSignUpMode && !is13OrOlder) {
      return Alert.alert(
        "Age Requirement",
        "You must be at least 13 years old to create a BuhEats account."
      );
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
        Alert.alert('Account Created!', 'Welcome to BuhEats!');
        // New users go through the welcome tour (first use only)
        router.replace({ pathname: '/onboarding', params: { from: 'signup' } });
      } else {
        await signIn("password", { email, password, flow: "signIn" });
        // Returning users go straight to the feed — the welcome tour only
        // runs on sign-up and can be replayed from the profile drawer.
        router.replace('/(tabs)/home');
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

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("No identity token returned by Apple");
      }

      // Apple only returns the name on first authorization — use that as
      // the signal for a first-time sign-in so new users get the tour.
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ") || undefined
        : undefined;

      // Clear any cached session before signing in (same as password flow)
      try {
        await signOut();
      } catch {
        console.log("No existing session to sign out");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      await signIn("apple", {
        identityToken: credential.identityToken,
        ...(fullName ? { fullName } : {}),
      });

      if (fullName) {
        Alert.alert("Account Created!", "Welcome to BuhEats!");
        router.replace({ pathname: "/onboarding", params: { from: "signup" } });
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      // User cancelled the Apple sheet — not an error worth an alert
      if (error?.code !== "ERR_REQUEST_CANCELED") {
        console.error(error);
        Alert.alert("Apple Sign-In Failed", error?.message || "Could not sign in with Apple.");
      }
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
    setIs13OrOlder(false);
    setSubmitted(false);
    setUsernameTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BuhEats</Text>
      
      {isSignUpMode && (
        <>
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
          {username.length > 0 && !hasMinUsername && (
            <Text style={styles.errorText}>At least 3 characters required</Text>
          )}
          {username.length >= 3 && (
            <Text style={styles.validText}>✓ Username looks good</Text>
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
        placeholder="Email"
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
        <Text style={styles.errorText}>Please enter a valid email (e.g., name@gmail.com)</Text>
      )}
      {email.length > 0 && isTestEmail(email) && (
        <Text style={styles.errorText}>Please use a real email address</Text>
      )}
      {email.length > 0 && isValidEmail(email) && !isTestEmail(email) && (
        <Text style={styles.validText}>✓ Valid email</Text>
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
      
      {password.length > 0 && !hasMinPassword && (
        <Text style={styles.errorText}>At least 8 characters required</Text>
      )}
      {password.length >= 8 && (
        <Text style={styles.validText}>✓ Password strength OK</Text>
      )}

      {isSignUpMode && (
        <TouchableOpacity
          style={styles.ageRow}
          activeOpacity={0.7}
          onPress={() => {
            setIs13OrOlder(!is13OrOlder);
            if (submitted) setSubmitted(false);
          }}
        >
          <View style={[styles.ageCheckbox, is13OrOlder && styles.ageCheckboxChecked]}>
            {is13OrOlder && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <Text style={styles.ageText}>
            I confirm I am 13 years of age or older
          </Text>
        </TouchableOpacity>
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

      {appleAuthAvailable && (
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text style={styles.appleButtonText}>
            {loading ? "Processing..." : "Continue with Apple"}
          </Text>
        </TouchableOpacity>
      )}

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
        <TouchableOpacity onPress={() => router.push('/tos')}>
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
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EAF6',
    borderWidth: 2,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: '90%',
    backgroundColor: '#000000',
    borderRadius: 15,
    marginTop: 10,
    gap: 8,
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    width: '90%',
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  validText: {
    width: '90%',
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  ageCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6c3b3b',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageCheckboxChecked: {
    backgroundColor: '#6c3b3b',
  },
  ageText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
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