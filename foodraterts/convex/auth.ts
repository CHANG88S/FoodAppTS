import { setupConvexAuth } from "@convex-dev/auth/server";
import { setupUsernamePassword } from "@convex-dev/auth/methods/username-password/server";
import { setupApple } from "@convex-dev/auth/methods/apple/server";
import { setupGoogle } from "@convex-dev/auth/methods/google/server";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";

export const auth = setupConvexAuth({
  component: components.auth,
  usersTable: "users",
});
export const { signOut, refreshSession, isAuthenticated } = auth;

// Username + password sign-in. The username component owns account
// resolution; the users row (with role and default boba preferences) is
// created by internal.users.createUserFromUsernamePassword.
export const {
  signUpWithUsernamePassword,
  signInWithUsernamePassword,
  changePassword,
} = setupUsernamePassword(auth, {
  component: components.authPassword,
  usernameComponent: components.authUsername,
}).attachUserCallbacks({
  createUser: internal.users.createUserFromUsernamePassword,
});

// Apple sign-in (web OAuth flow — 2.0 has no native identity-token
// method, so the client drives it through an in-app auth session and
// completes it with the one-time code). `redirectTo` must be an https
// origin listed in allowedRedirectOrigins below.
export const { startSignInWithApple, completeSignInWithApple } = setupApple(
  auth,
  {
    component: components.authApple,
    allowedRedirectOrigins: ["https://chang88s.github.io"],
  },
).attachUserCallbacks({
  createUser: internal.users.createUserFromApple,
});

// Google sign-in (same web OAuth flow as Apple — the client opens the
// authorize URL in an in-app auth session and completes it with the one-time
// ticket code). `redirectTo` must be an https origin listed in
// allowedRedirectOrigins below.
export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(
  auth,
  {
    component: components.authGoogle,
    allowedRedirectOrigins: ["https://chang88s.github.io"],
  },
).attachUserCallbacks({
  createUser: internal.users.createUserFromGoogle,
});
