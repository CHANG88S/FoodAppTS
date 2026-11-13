import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, Alert, View, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery, useConvex } from "convex/react";
import * as WebBrowser from "expo-web-browser";
import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { api } from "../convex/_generated/api";

// OAuth redirect target for Apple and Google — must be an https origin listed
// in allowedRedirectOrigins (convex/auth.ts). Convex's callback 303s here with
// the one-time ticket in the query string; the page (docs/oauth-callback.html
// on the GitHub Pages site) then bounces the ticket to buheats://callback,
// because an auth session can't detect an https navigation on iOS — only a
// custom scheme (see ASWebAuthenticationSession's callbackURLScheme).
const OAUTH_REDIRECT_URI = "https://chang88s.github.io/FoodAppTS/oauth-callback.html";

// The scheme the auth session watches for. Any buheats:// navigation in the
// auth browser completes the session and hands the URL back to the app.
const OAUTH_CALLBACK_URL = "buheats://callback";

// Read a value out of a URL's query string (Hermes URLSearchParams support
// varies across RN releases, so this is done by hand).
function queryParam(url: string, name: string): string | null {
  const qIndex = url.indexOf("?");
  if (qIndex === -1) return null;
  const hashIndex = url.indexOf("#", qIndex);
  const query = hashIndex === -1 ? url.slice(qIndex + 1) : url.slice(qIndex + 1, hashIndex);
  for (const pair of query.split("&")) {
    const [key, value = ""] = pair.split("=");
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(value.replace(/\+/g, " "));
    }
  }
  return null;
}

// Human messages for the 2.0 userError envelopes — every failure arrives as
// `status: "error"` with a `userError`, so callers never need their own
// try/catch for these.
function describeSignUpError(userError: any): string {
  switch (userError?.error) {
    case "PASSWORD_TOO_SHORT":
      return `Password must be at least ${userError.minimumLength} characters long.`;
    case "PASSWORD_TOO_LONG":
      return `Password must be at most ${userError.maximumLength} characters long.`;
    case "PASSWORD_HAS_SURROUNDING_WHITESPACE":
      return "Password can't start or end with spaces.";
    case "PASSWORD_TOO_COMMON":
      return "That password is too common — please pick a stronger one.";
    case "USERNAME_TOO_SHORT":
      return `Username must be at least ${userError.minimumLength} characters long.`;
    case "USERNAME_TOO_LONG":
      return `Username must be at most ${userError.maximumLength} characters long.`;
    case "USERNAME_HAS_SURROUNDING_WHITESPACE":
      return "Username can't start or end with spaces.";
    case "USERNAME_HAS_INVALID_CHARACTERS":
      return "Username can only contain letters, numbers, and underscores.";
    case "USERNAME_TAKEN":
      return "That username is already taken.";
    default:
      return "Could not create your account. Please try again.";
  }
}

function describeSignInError(userError: any): string {
  switch (userError?.error) {
    case "INVALID_CREDENTIALS":
      return "Incorrect username or password.";
    case "USER_NOT_FOUND":
      return "No account found with that username.";
    case "RATE_LIMITED":
      return "Too many attempts. Please try again shortly.";
    default:
      return "Login failed. Please try again.";
  }
}

const LoginIndex = () => {
  const router = useRouter();
  const convex = useConvex();
  // 2.0 actions: setSession consumes the token bundle a sign-in flow returns.
  const { setSession, signOut } = useAuthActions();
  const { signIn } = useSignInWithUsernamePassword(api.auth);
  const { signUp } = useSignUpWithUsernamePassword(api.auth);
  const startApple = useMutation(api.auth.startSignInWithApple);
  const completeApple = useMutation(api.auth.completeSignInWithApple);
  const startGoogle = useMutation(api.auth.startSignInWithGoogle);
  const completeGoogle = useMutation(api.auth.completeSignInWithGoogle);
  const updateUser = useMutation(api.users.updateUser);

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [is13OrOlder, setIs13OrOlder] = useState(false);
  // Which control started the auth action — drives both the global busy state
  // and which single button shows "Processing..." (the rest just disable).
  const [pending, setPending] = useState<null | "password" | "apple" | "google" | "guest">(null);
  const loading = pending !== null;

  // Apple sign-in is the 2.0 web OAuth flow through an in-app auth session,
  // which works on any iOS device — no native SIWA capability needed.
  const showAppleButton = Platform.OS === "ios";

  // Track submission attempt and field interactions
  const [submitted, setSubmitted] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Sessions persist (tokens survive restarts via SecureStore), so this screen
  // is only ever shown to signed-out users: once auth state resolves and a
  // session exists, jump straight into the app. 2.0 has no client auth-state
  // hook — `api.auth.isAuthenticated` is the reactive source of truth (the
  // provider subscribes to it too; undefined = still resolving). The
  // `!loading` guard keeps a sign-in in progress from being hijacked — OAuth
  // sign-ups still route to onboarding below after the session is established.
  const isAuthenticated = useQuery(api.auth.isAuthenticated);
  useEffect(() => {
    if (isAuthenticated === true && !loading) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, loading, router]);
  if (isAuthenticated === undefined) {
    return null;
  }

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
    return hasMinUsername && hasMinPassword;
  };

  const handleAuthAction = async () => {
    setSubmitted(true);

    if (!password || !username || (isSignUpMode && !email)) {
      return Alert.alert("Error", "Please fill out all required fields.");
    }

    if (isSignUpMode && !isValidEmail(email)) {
      return Alert.alert("Error", "Please enter a valid email address.");
    }

    if (isSignUpMode && isTestEmail(email)) {
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

    setPending("password");
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
        const result = await signUp({ username: username.trim(), password });
        if (result.status !== "complete") {
          return Alert.alert("Sign-Up Failed", describeSignUpError(result.userError));
        }
        // 2.0 keeps the username in its own component and the create callback
        // never sees it, so mirror the profile fields into the users row now
        // that the session is live.
        await updateUser({
          username: username.trim(),
          email: email.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
        });
        Alert.alert('Account Created!', 'Welcome to BuhEats!');
        // New users go through the welcome tour (first use only)
        router.replace({ pathname: '/onboarding', params: { from: 'signup' } });
      } else {
        const result = await signIn({ username: username.trim(), password });
        if (result.status !== "complete") {
          return Alert.alert('Login Failed', describeSignInError(result.userError));
        }
        // Returning users go straight to the feed — the welcome tour only
        // runs on sign-up and can be replayed from the profile drawer.
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Authentication Failed', error.message || 'Invalid credentials or network error.');
    } finally {
      setPending(null);
    }
  };

  const handleContinueAsGuest = async () => {
    setPending("guest");
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
      setPending(null);
    }
  };

  const handleAppleSignIn = async () => {
    setPending("apple");
    try {
      // 2.0 Apple sign-in is a web OAuth flow: open Apple's authorize page in
      // an in-app auth session, then complete with the one-time ticket code
      // the component's callback appends to the redirect URL.
      const { redirect, state } = await startApple({ redirectTo: OAUTH_REDIRECT_URI });
      const outcome = await WebBrowser.openAuthSessionAsync(redirect, OAUTH_CALLBACK_URL);
      if (outcome.type !== "success") {
        return; // user closed the sheet — not an error worth an alert
      }

      const oauthError = queryParam(outcome.url, "convexAuthError");
      if (oauthError) {
        throw new Error("Apple sign-in was not completed. Please try again.");
      }
      const code = queryParam(outcome.url, "convexAuthCode");
      if (!code) {
        throw new Error("No sign-in code returned by Apple");
      }

      const result = await completeApple({ state, code });
      if (result.status !== "complete") {
        throw new Error("Apple sign-in could not be completed. Please try again.");
      }
      await setSession(result.tokens);

      // The ticket doesn't say whether the account is new, so creation time is
      // the signal for sending a first-timer through the welcome tour (v1
      // keyed this off Apple's one-time name relay).
      const user = await convex.query(api.users.getUser, { userId: result.tokens.userId }) as any;
      if (user && Date.now() - user._creationTime < 60_000) {
        Alert.alert("Account Created!", "Welcome to BuhEats!");
        // needsProfile adds the display-name/username step — OAuth sign-ups
        // never chose those (the backend generated placeholders).
        router.replace({ pathname: "/onboarding", params: { from: "signup", needsProfile: "1" } });
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Apple Sign-In Failed", error?.message || "Could not sign in with Apple.");
    } finally {
      setPending(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setPending("google");
    try {
      // Same web OAuth flow as Apple: open Google's authorize page in an
      // in-app auth session, then complete with the one-time ticket code the
      // component's callback appends to the redirect URL.
      const { redirect, state } = await startGoogle({ redirectTo: OAUTH_REDIRECT_URI });
      const outcome = await WebBrowser.openAuthSessionAsync(redirect, OAUTH_CALLBACK_URL);
      if (outcome.type !== "success") {
        return; // user closed the sheet — not an error worth an alert
      }

      const oauthError = queryParam(outcome.url, "convexAuthError");
      if (oauthError) {
        throw new Error("Google sign-in was not completed. Please try again.");
      }
      const code = queryParam(outcome.url, "convexAuthCode");
      if (!code) {
        throw new Error("No sign-in code returned by Google");
      }

      const result = await completeGoogle({ state, code });
      if (result.status !== "complete") {
        throw new Error("Google sign-in could not be completed. Please try again.");
      }
      await setSession(result.tokens);

      const user = await convex.query(api.users.getUser, { userId: result.tokens.userId }) as any;
      if (user && Date.now() - user._creationTime < 60_000) {
        Alert.alert("Account Created!", "Welcome to BuhEats!");
        // needsProfile adds the display-name/username step — OAuth sign-ups
        // never chose those (the backend generated placeholders).
        router.replace({ pathname: "/onboarding", params: { from: "signup", needsProfile: "1" } });
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Google Sign-In Failed", error?.message || "Could not sign in with Google.");
    } finally {
      setPending(null);
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BuhEats</Text>

      <TextInput
        style={styles.textInput}
        placeholder={isSignUpMode ? "Username (min. 3 characters)" : "Username"}
        placeholderTextColor="#6B7280"
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

      {isSignUpMode && (
        <TextInput
          style={styles.textInput}
          placeholder="Display Name (Optional)"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />
      )}

      {isSignUpMode && (
        <>
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor="#6B7280"
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
        </>
      )}

      <TextInput
        style={styles.textInput}
        placeholder="Password"
        placeholderTextColor="#6B7280"
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
          {pending === "password" ? "Processing..." : isSignUpMode ? "Create Account" : "Login"}
        </Text>
      </TouchableOpacity>

      {showAppleButton && (
        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text style={styles.appleButtonText}>
            {pending === "apple" ? "Processing..." : "Continue with Apple"}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <Ionicons name="logo-google" size={18} color="#1F2937" />
        <Text style={styles.googleButtonText}>
          {pending === "google" ? "Processing..." : "Continue with Google"}
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
    </TouchableWithoutFeedback>
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 15,
    marginTop: 10,
    gap: 8,
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1F2937',
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
