import { query, action, mutation, QueryCtx, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { retrieveAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper function to fetch a user document directly
async function fetchUserViewer(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
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
    await ctx.db.patch(userId, { profilePicture: args.imageStorageId });
  },
});

// Added updateUser mutation to handle client calls and onboarding
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
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

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.username !== undefined) updates.username = args.username;
    if (args.city !== undefined) updates.city = args.city;
    if (args.preferences !== undefined) updates.preferences = args.preferences;

    await ctx.db.patch(userId as any, updates);
    return true;
  },
});

export const updateProfile = action({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    currentPassword: v.optional(v.string()),
    newPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Retrieve user details via an internal query
    const currentUser = await ctx.runQuery(internal.users.getInternalViewer, {});
    if (!currentUser) throw new Error("User not found");

    if (args.username && args.username !== currentUser.username) {
      const existingUser = await ctx.runQuery(internal.users.getInternalUserByUsername, { username: args.username });
      if (existingUser && existingUser._id !== userId) {
        throw new Error("Username is already taken.");
      }
    }

    // Handle password update and current password verification
    if (args.newPassword && args.newPassword.trim().length > 0) {
      if (!args.currentPassword) {
        throw new Error("Current password is required to set a new password.");
      }

      const email = currentUser.email;
      if (!email) {
        throw new Error("User email not found.");
      }

      const provider = "password";
      const retrieved = await retrieveAccount(ctx, {
        provider,
        account: { id: email, secret: args.currentPassword },
      });

      if (retrieved === null) {
        throw new Error("Incorrect current password.");
      }

      await modifyAccountCredentials(ctx, {
        provider,
        account: { id: email, secret: args.newPassword },
      });
    }

    // Run internal mutation to patch the profile fields
    await ctx.runMutation(internal.users.patchUserProfile, {
      userId,
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
    return await ctx.db.get(userId);
  },
});

export const getInternalUserByUsername = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();
  },
});

// Public query to get user by username (for profile viewing)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();
  },
});

// Public query to get user by ID (for messaging, etc.)
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

    // Check if already following
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", userId).eq("followingId", args.followingId)
      )
      .first();

    if (existing) return { success: false, message: "Already following" };

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: userId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    // Create notification for the followed user
    await ctx.db.insert("notifications", {
      recipientId: args.followingId,
      senderId: userId,
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
        q.eq("followerId", userId).eq("followingId", args.followingId)
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
        q.eq("followerId", userId).eq("followingId", args.followingId)
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

    return users.filter((u) => {
      return (
        u.username?.toLowerCase().includes(queryLower) ||
        u.name?.toLowerCase().includes(queryLower)
      );
    });
  },
});

// Update user preferences (boba settings, colors, etc.)
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

    const currentUser = await ctx.db.get(userId as any) as any;
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

// Delete user account
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Delete all related data
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