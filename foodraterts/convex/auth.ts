import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth } from "@convex-dev/auth/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Apple publishes its signing keys at a fixed JWKS endpoint; jose caches
// and rotates them automatically. Tokens are RS256 JWTs whose `aud` is
// our bundle id and whose `sub` is the stable, per-developer Apple user id.
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const APPLE_BUNDLE_ID = "com.chang88s.buheats";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          username: params.username as string,
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
    ConvexCredentials({
      id: "apple",
      authorize: async (credentials, ctx) => {
        const identityToken = credentials.identityToken;
        if (typeof identityToken !== "string") {
          throw new Error("Missing Apple identity token");
        }

        const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
          issuer: "https://appleid.apple.com",
          audience: APPLE_BUNDLE_ID,
        });

        const appleId = payload.sub;
        if (!appleId) {
          throw new Error("Invalid Apple identity token");
        }

        // Returning Apple user
        const existingByAppleId: Doc<"users"> | null = await ctx.runQuery(
          internal.appleAuth.getByAppleId,
          { appleId }
        );
        if (existingByAppleId) {
          return { userId: existingByAppleId._id };
        }

        // Apple includes `email` in every token where the user granted the
        // email scope (relay addresses included) — it is always verified.
        const email =
          typeof payload.email === "string" && payload.email ? payload.email : null;
        const name =
          typeof credentials.fullName === "string" && credentials.fullName
            ? credentials.fullName
            : undefined;

        // First Apple sign-in matching an existing password account: link
        // them so both sign-in methods reach the same profile.
        if (email) {
          const byEmail: Doc<"users"> | null = await ctx.runQuery(
            internal.appleAuth.getByEmail,
            { email }
          );
          if (byEmail && !byEmail.appleId) {
            await ctx.runMutation(internal.appleAuth.linkAppleId, {
              userId: byEmail._id,
              appleId,
            });
            return { userId: byEmail._id };
          }
        }

        // Brand-new Apple-only user. Users who declined the email scope get
        // a stable placeholder (unique per Apple ID, never used for mail).
        const userId = await ctx.runMutation(internal.appleAuth.createAppleUser, {
          appleId,
          email: email ?? `${appleId}@apple-sso.placeholder`,
          ...(name ? { name } : {}),
        });
        return { userId };
      },
    }),
  ],
});
