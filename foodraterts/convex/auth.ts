import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string) || "FoodRater User",
          role: "user",
          city: "Riverside, CA",
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