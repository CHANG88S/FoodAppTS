import { query, action, mutation, QueryCtx, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { vAppleProfile } from "@convex-dev/auth/methods/apple/server";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { Id } from "./_generated/dataModel";
import { hasBlockBetween } from "./blocks";

// Helper function to fetch a user document safely with type casting
async function fetchUserViewer(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId as any);
}

export const getUserRole = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;
    return { 
      userId: user._id, 
      role: user.role, 
      username: user.username, 
      name: user.name ?? null 
    };
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await fetchUserViewer(ctx);
  },
});

export const setDisplayedBadge = mutation({
  args: { badgeTitle: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId as any, { displayedBadge: args.badgeTitle });
  },
});

export const setProfilePicture = mutation({
  args: { imageStorageId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(userId as any, { profilePicture: args.imageStorageId });
  },
});

// Update user mutation supporting onboarding and profile edits safely.
// In Convex Auth 2.0 sign-up only carries the username, so email/name are
// attached right after sign-up through this mutation.
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    city: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        sweetness: v.optional(v.number()),
        iceLevel: v.optional(v.number()),
        milkBase: v.optional(v.string()),
        favoriteColor: v.optional(v.string()),
        favoriteCuisines: v.optional(v.array(v.string())),
        dietaryRestrictions: v.optional(v.array(v.string())),
        spiceTolerance: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    if (args.email !== undefined) {
      const taken = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();
      if (taken && taken._id !== userId) {
        throw new Error("Email is already in use by another account.");
      }
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.email !== undefined) updates.email = args.email;
    if (args.city !== undefined) updates.city = args.city;
    if (args.preferences !== undefined) updates.preferences = args.preferences;

    await ctx.db.patch(userId as any, updates);
    return true;
  },
});

// Profile field updates (name/username/email). Password changes go through
// api.auth.changePassword (Convex Auth 2.0 verifies the current password
// server-side), so this action no longer touches credentials.
export const updateProfile = action({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ActionCtx's runQuery rest-args type is structurally narrower than the
    // GenericQueryCtx one this helper declares, so the ctx needs a cast.
    const userId = await getAuthUserId(ctx as any);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = (await ctx.runQuery(internal.users.getInternalViewer, {})) as any;
    if (!currentUser) throw new Error("User not found");

    if (args.username && args.username !== currentUser.username) {
      const existingUser = (await ctx.runQuery(internal.users.getInternalUserByUsername, { username: args.username })) as any;
      if (existingUser && existingUser._id !== userId) {
        throw new Error("Username is already taken.");
      }
    }

    await ctx.runMutation(internal.users.patchUserProfile, {
      userId: userId as Id<"users">,
      name: args.name,
      username: args.username,
      email: args.email,
    });

    return true;
  },
});

export const getInternalViewer = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId as any);
  },
});

export const getInternalUserByUsername = internalQuery({
  args: { username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.username) return null;
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();
  },
});

export const getUserByUsername = query({
  args: { username: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.username) return null;
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId as Id<"users">);
  },
});

export const patchUserProfile = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.email !== undefined) updates.email = args.email;

    await ctx.db.patch(args.userId, updates);
  },
});

// Follow System
export const followUser = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    if (userId === args.followingId) throw new Error("Cannot follow yourself");

    // Enforce blocks: can't follow a user you blocked or who blocked you
    if (await hasBlockBetween(ctx, userId as string, args.followingId as string)) {
      throw new Error("You can't follow this user");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", userId as string).eq("followingId", args.followingId)
      )
      .first();

    if (existing) return { success: false, message: "Already following" };

    await ctx.db.insert("follows", {
      followerId: userId as string,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      recipientId: args.followingId,
      senderId: userId as string,
      type: "follow",
      targetType: "user",
      targetId: undefined,
      message: undefined,
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", userId as string).eq("followingId", args.followingId)
      )
      .first();

    if (!existing) return { success: false, message: "Not following" };

    await ctx.db.delete(existing._id);
    return { success: true };
  },
});

export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", userId as string).eq("followingId", args.followingId)
      )
      .first();

    return !!follow;
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId as Id<"users">);
        return user;
      })
    );

    return followers.filter(Boolean);
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId as Id<"users">);
        return user;
      })
    );

    return following.filter(Boolean);
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const users = await ctx.db.query("users").collect();
    const queryLower = args.query.toLowerCase();

    return users.filter((u: any) => {
      return (
        u.username?.toLowerCase().includes(queryLower) ||
        u.name?.toLowerCase().includes(queryLower)
      );
    });
  },
});

export const updatePreferences = mutation({
  args: {
    sweetness: v.optional(v.number()),
    iceLevel: v.optional(v.number()),
    milkBase: v.optional(v.string()),
    favoriteColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = (await ctx.db.get(userId as any)) as any;
    if (!currentUser) throw new Error("User not found");

    const currentPrefs = currentUser.preferences || {};

    await ctx.db.patch(userId as any, {
      preferences: {
        ...currentPrefs,
        ...(args.sweetness !== undefined && { sweetness: args.sweetness }),
        ...(args.iceLevel !== undefined && { iceLevel: args.iceLevel }),
        ...(args.milkBase !== undefined && { milkBase: args.milkBase }),
        ...(args.favoriteColor !== undefined && { favoriteColor: args.favoriteColor }),
      },
    });

    return { success: true };
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const followsAsFollower = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId as string))
      .collect();
    for (const follow of followsAsFollower) {
      await ctx.db.delete(follow._id);
    }

    const followsAsFollowing = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId as string))
      .collect();
    for (const follow of followsAsFollowing) {
      await ctx.db.delete(follow._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId as string))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    const sentNotifications = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("senderId"), userId as string))
      .collect();
    for (const notification of sentNotifications) {
      await ctx.db.delete(notification._id);
    }

    const reviews = await ctx.db
      .query("itemReviews")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    const tweets = await ctx.db
      .query("tweets")
      .withIndex("by_user", (q) => q.eq("userId", userId as string))
      .collect();
    for (const tweet of tweets) {
      await ctx.db.delete(tweet._id);
    }

    const conversations1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId as string))
      .collect();
    for (const conversation of conversations1) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id as string))
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(conversation._id);
    }

    const conversations2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId as string))
      .collect();
    for (const conversation of conversations2) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id as string))
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(conversation._id);
    }

    await ctx.db.delete(userId as any);

    return { success: true };
  },
});
// ── Convex Auth 2.0 user-creation callbacks ────────────────────────────────
// Each sign-in method calls its callback for a *new* identity only; returning
// an existing user's id links that identity onto the existing account.

const DEFAULT_PREFERENCES = {
  sweetness: 0.5,
  iceLevel: 0.5,
  milkBase: "Oat Milk",
  favoriteCuisines: [] as string[],
  dietaryRestrictions: [] as string[],
};

async function generateUsername(ctx: QueryCtx, email: string, name?: string): Promise<string> {
  const source = name || email.split("@")[0] || "user";
  const base = source.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "user";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}${Math.random().toString(36).slice(2, 6)}`;
    const taken = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), candidate))
      .first();
    if (!taken) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}

// Username + password sign-up. The 2.0 method keeps the username in its own
// component (it maps username → user id at sign-in), so at create time the
// callback sees an empty profile — a temporary placeholder fills the required
// column and the client mirrors the real username (plus email and display
// name) into the row via updateUser right after the session is live.
export const createUserFromUsernamePassword = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
      profile: v.object({}),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      username: `pending-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      preferences: DEFAULT_PREFERENCES,
    });
  },
});

// Apple sign-up. Port of the v1 provider logic: relink v1-era users by
// appleId, link onto an existing account sharing the verified email, else
// create an Apple-only profile with a generated username. Users who declined
// the email scope get a stable placeholder (never used for mail).
export const createUserFromApple = internalMutation({
  args: {
    method: v.object({
      name: v.literal("apple"),
      profile: vAppleProfile,
    }),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const appleId = args.method.profile.id;
    const email = args.method.profile.email;

    const existingByAppleId = await ctx.db
      .query("users")
      .withIndex("by_appleId", (q) => q.eq("appleId", appleId))
      .first();
    if (existingByAppleId) {
      return existingByAppleId._id;
    }

    if (email) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (byEmail && !byEmail.appleId) {
        await ctx.db.patch(byEmail._id, { appleId });
        return byEmail._id;
      }
    }

    const username = await generateUsername(ctx, email ?? appleId, args.method.profile.name);
    return await ctx.db.insert("users", {
      username,
      email: email ?? `${appleId}@apple-sso.placeholder`,
      ...(args.method.profile.name ? { name: args.method.profile.name } : {}),
      appleId,
      role: "user",
      preferences: DEFAULT_PREFERENCES,
    });
  },
});

// Google sign-up. Same relink-and-create pattern as Apple: relink v1-era
// users by googleId, link onto an existing account sharing a *verified*
// email (Google only sometimes attests verification, so don't trust
// unverified addresses for linking), else create a Google-only profile.
export const createUserFromGoogle = internalMutation({
  args: {
    method: v.object({
      name: v.literal("google"),
      profile: vGoogleProfile,
    }),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const googleId = args.method.profile.id;
    const email = args.method.profile.email;

    const existingByGoogleId = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", googleId))
      .first();
    if (existingByGoogleId) {
      return existingByGoogleId._id;
    }

    if (email && args.method.profile.emailVerified) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (byEmail && !byEmail.googleId) {
        await ctx.db.patch(byEmail._id, { googleId });
        return byEmail._id;
      }
    }

    const username = await generateUsername(ctx, email ?? googleId, args.method.profile.name);
    return await ctx.db.insert("users", {
      username,
      email: email ?? `${googleId}@google-sso.placeholder`,
      ...(args.method.profile.name ? { name: args.method.profile.name } : {}),
      googleId,
      role: "user",
      preferences: DEFAULT_PREFERENCES,
    });
  },
});
