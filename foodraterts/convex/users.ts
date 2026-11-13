import { query, action, mutation, QueryCtx, MutationCtx, internalQuery, internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
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

// Account deletion. The mutation the client calls removes the account itself
// in one small transaction: the profile row, the profile picture, the
// sign-in username and every other session. Everything the user created is
// then removed by purgeUserData in batches, each its own transaction, so a
// very active account cannot exceed the per-transaction write limit and leave
// nothing deleted.
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    await deleteFile(ctx, user?.profilePicture);

    // The current session is left for the client's signOut call, which
    // clears the stored tokens on the device as well.
    const currentSessionId = (await ctx.auth.getUserIdentity())?.subject;
    const sessions = await ctx.runQuery(components.auth.public.listSessions, { userId });
    const otherSessionIds = sessions
      .map((s) => s.sessionId as string)
      .filter((id) => id !== currentSessionId);
    if (otherSessionIds.length > 0) {
      await ctx.runMutation(components.auth.public.revokeSessions, { sessionIds: otherSessionIds });
    }
    // Frees the name and stops username + password sign-in to this account.
    await ctx.runMutation(components.authUsername.public.deleteUsername, { userId });

    if (user) await ctx.db.delete(userId);

    await ctx.scheduler.runAfter(0, internal.users.purgeUserData, { userId, step: 0 });
    return { success: true };
  },
});

const PURGE_BATCH = 200;

async function deleteFile(ctx: MutationCtx, value: string | undefined) {
  const fileId = value ? ctx.db.system.normalizeId("_storage", value) : null;
  if (fileId && (await ctx.db.system.get(fileId))) {
    await ctx.storage.delete(fileId);
  }
}

// Deletes the rows (and their files) and reports whether the range is empty.
async function deleteRows<T extends { _id: Id<any> }>(
  ctx: MutationCtx,
  rows: T[],
  filesOf?: (row: T) => Promise<(string | undefined)[]> | (string | undefined)[],
) {
  for (const row of rows) {
    for (const file of (await filesOf?.(row)) ?? []) {
      await deleteFile(ctx, file);
    }
    await ctx.db.delete(row._id);
  }
  return rows.length < PURGE_BATCH;
}

// One entry per index range that holds the user's rows. Each call deletes at
// most PURGE_BATCH rows and returns true once its range is empty.
const PURGE_STEPS: Array<(ctx: MutationCtx, userId: Id<"users">) => Promise<boolean>> = [
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("notifications")
      .withIndex("by_sender", (q) => q.eq("senderId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(
      ctx,
      await ctx.db.query("itemReviews")
        .withIndex("by_user", (q) => q.eq("userId", userId)).take(PURGE_BATCH),
      async (review) => {
        // A review photo can also be its menu item's photo (and from there a
        // chain location's copy), so it is kept while the item still uses it.
        const item = await ctx.db.get(review.itemId);
        return [review.imageStorageId, review.originalImageStorageId, review.updatedImageStorageId]
          .filter((file) => file && file !== item?.imageStorageId);
      },
    ),
  async (ctx, userId) =>
    deleteRows(
      ctx,
      await ctx.db.query("tweets")
        .withIndex("by_user", (q) => q.eq("userId", userId)).take(PURGE_BATCH),
      (tweet) => [tweet.imageStorageId],
    ),
  async (ctx, userId) => purgeConversation(ctx, "participant1Id", userId),
  async (ctx, userId) => purgeConversation(ctx, "participant2Id", userId),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("bookmarks")
      .withIndex("by_user_and_type", (q) => q.eq("userId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("userBlocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("restaurantVisits")
      .withIndex("by_user_and_restaurant", (q) => q.eq("userId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("contentFlags")
      .withIndex("by_reportedBy", (q) => q.eq("reportedBy", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("userReports")
      .withIndex("by_reporterId", (q) => q.eq("reporterId", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("placeSuggestions")
      .withIndex("by_suggester", (q) => q.eq("suggestedBy", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("menuItemSuggestions")
      .withIndex("by_suggester", (q) => q.eq("suggestedBy", userId)).take(PURGE_BATCH)),
  async (ctx, userId) =>
    deleteRows(ctx, await ctx.db.query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId)).take(PURGE_BATCH)),
];

// Deletes one conversation's messages a batch at a time, then the
// conversation, then reports done once the user is in no conversation.
async function purgeConversation(
  ctx: MutationCtx,
  side: "participant1Id" | "participant2Id",
  userId: Id<"users">,
) {
  const conversation = await ctx.db
    .query("conversations")
    .withIndex(side === "participant1Id" ? "by_participant1" : "by_participant2", (q: any) =>
      q.eq(side, userId))
    .first();
  if (!conversation) return true;

  const messages = await ctx.db
    .query("messages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
    .take(PURGE_BATCH);
  const messagesDone = await deleteRows(ctx, messages, (message) => [message.imageStorageId]);
  if (messagesDone) await ctx.db.delete(conversation._id);
  return false;
}

export const purgeUserData = internalMutation({
  args: { userId: v.id("users"), step: v.number() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const run = PURGE_STEPS[args.step];
    if (!run) return null;

    const stepDone = await run(ctx, args.userId);
    await ctx.scheduler.runAfter(0, internal.users.purgeUserData, {
      userId: args.userId,
      step: stepDone ? args.step + 1 : args.step,
    });
    return null;
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
