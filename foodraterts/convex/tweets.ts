import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// 1. GENERATE THE UPLOAD URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// 2. CREATE A TWEET WITH AN IMAGE STORAGE ID OR TEXT
export const createTweet = mutation({
  args: { 
    body: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to tweet.");

    await ctx.db.insert("tweets", {
      body: args.body,
      imageStorageId: args.imageStorageId,
      userId: userId,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
  },
});

export const getUserTweets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tweets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getTweetsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tweets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20); // Limit to 20 most recent
  },
});

export const deleteTweet = mutation({
  args: { tweetId: v.id("tweets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tweet = await ctx.db.get(args.tweetId);
    if (!tweet) throw new Error("Tweet not found");

    if (tweet.userId && tweet.userId !== userId) {
      throw new Error("You are not authorized to delete this tweet");
    }

    await ctx.db.delete(args.tweetId);
  },
});

export const toggleLikeTweet = mutation({
  args: { tweetId: v.id("tweets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tweet = await ctx.db.get(args.tweetId);
    if (!tweet) throw new Error("Tweet not found");

    const currentLikes = tweet.likes || [];
    const hasLiked = currentLikes.includes(userId);
    const updatedLikes = hasLiked
      ? currentLikes.filter((id: string) => id !== userId)
      : [...currentLikes, userId];

    await ctx.db.patch(args.tweetId, { likes: updatedLikes });

    // Create notification for new like (if liking someone else's tweet)
    if (!hasLiked && tweet.userId && tweet.userId !== userId) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: tweet.userId,
        senderId: userId,
        type: "like",
        targetType: "tweet",
        targetId: args.tweetId,
        message: undefined,
      });
    }
  },
});

// 3. ADD A COMMENT TO A TWEET
export const addCommentToTweet = mutation({
  args: {
    tweetId: v.id("tweets"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tweet = await ctx.db.get(args.tweetId);
    if (!tweet) throw new Error("Tweet not found");

    const currentComments = tweet.comments || [];
    const newComment = {
      _id: Math.random().toString(36).substring(2, 9),
      userId: userId,
      body: args.body,
      createdAt: Date.now(),
    };

    await ctx.db.patch(args.tweetId, {
      comments: [...currentComments, newComment],
    });

    // Create notification for comment (if commenting on someone else's tweet)
    if (tweet.userId && tweet.userId !== userId) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: tweet.userId,
        senderId: userId,
        type: "comment",
        targetType: "tweet",
        targetId: args.tweetId,
        message: args.body,
      });
    }
  },
});

// 4. DELETE A COMMENT FROM A TWEET
export const deleteCommentFromTweet = mutation({
  args: { 
    tweetId: v.id("tweets"),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const tweet = await ctx.db.get(args.tweetId);
    if (!tweet) throw new Error("Tweet not found");

    const currentComments = tweet.comments || [];
    const updatedComments = currentComments.filter((c: any) => c._id !== args.commentId && c.commentId !== args.commentId);

    await ctx.db.patch(args.tweetId, {
      comments: updatedComments,
    });
  },
});