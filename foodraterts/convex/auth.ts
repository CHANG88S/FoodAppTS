import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          username: params.username as string,
          // Only include name if it exists, otherwise omit or set to null/empty string
          ...(params.name ? { name: params.name as string } : {}),
          role: "user",
          preferences: {
            sweetness: 0.5,
            iceLevel: 0.5,
            milkBase: "Oat Milk",
            favoriteCuisines: [],
            dietaryRestrictions: [],
          },
        };
      },
    }),
  ],
});