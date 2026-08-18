import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Toggle bookmark on/off
export const toggleBookmark = mutation({
  args: {
    targetType: v.union(v.literal("restaurant"), v.literal("review"), v.literal("tweet")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to bookmark");
    }

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_target", (q) =>
        q.eq("userId", userId as any)
         .eq("targetType", args.targetType)
         .eq("targetId", args.targetId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    } else {
      await ctx.db.insert("bookmarks", {
        userId: userId as any,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Check if something is bookmarked
export const isBookmarked = query({
  args: {
    targetType: v.union(v.literal("restaurant"), v.literal("review"), v.literal("tweet")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_target", (q) =>
        q.eq("userId", userId as any)
         .eq("targetType", args.targetType)
         .eq("targetId", args.targetId)
      )
      .first();

    return !!existing;
  },
});

// List bookmarked restaurants
export const listBookmarkedRestaurants = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId as any).eq("targetType", "restaurant")
      )
      .order("desc")
      .take(50);

    const results = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const restaurant = await ctx.db.get(bookmark.targetId as any);
        if (!restaurant) return null;
        return {
          bookmarkId: bookmark._id,
          restaurant,
          bookmarkedAt: bookmark.createdAt,
        };
      })
    );

    return results.filter((r) => r !== null);
  },
});

// List bookmarked reviews
export const listBookmarkedReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId as any).eq("targetType", "review")
      )
      .order("desc")
      .take(50);

    const results = await Promise.all(
      bookmarks.map(async (bookmark) => {
        // Parse composite review key: `${reviewId}-created|updated`
        const parts = bookmark.targetId.split("-");
        const reviewId = parts[0];
        const suffix = parts[parts.length - 1]; // Get last part
        const activityType = suffix === "updated" ? "updated" : "rated";

        const review = (await ctx.db.get(reviewId as any)) as any;
        if (!review) return null;

        // Hydrate item and restaurant
        const item = (await ctx.db.get(review.itemId as any)) as any;
        if (!item) return null;

        const restaurant = (await ctx.db.get(item.restaurantId as any)) as any;
        if (!restaurant) return null;

        // Get author info
        const author = (await ctx.db.get(review.userId as any)) as any;
        const authorName = author?.name || author?.username || "User";
        const authorHandle = author?.username ? `@${author.username}` : "@user";

        // Determine which image to show
        let imageStorageId = review.imageStorageId;
        if (activityType === "updated") {
          imageStorageId = review.updatedImageStorageId || review.originalImageStorageId || review.imageStorageId;
        }

        return {
          bookmarkId: bookmark._id,
          reviewId: bookmark.targetId,
          activityType,
          itemName: item.itemName,
          restaurantName: restaurant.restaurantName,
          overallRating: review.overallRating,
          notes: review.notes,
          imageStorageId,
          authorName,
          authorHandle,
          bookmarkedAt: bookmark.createdAt,
        };
      })
    );

    return results.filter((r) => r !== null);
  },
});

// List bookmarked tweets
export const listBookmarkedTweets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId as any).eq("targetType", "tweet")
      )
      .order("desc")
      .take(50);

    const results = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const tweet = (await ctx.db.get(bookmark.targetId as any)) as any;
        if (!tweet) return null;

        // Get author info (handle legacy tweets without userId)
        let authorName = "User";
        let authorHandle = "@user";
        if (tweet.userId) {
          const author = (await ctx.db.get(tweet.userId as any)) as any;
          authorName = author?.name || author?.username || "User";
          authorHandle = author?.username ? `@${author.username}` : "@user";
        }

        return {
          bookmarkId: bookmark._id,
          tweet: {
            ...tweet,
            authorName,
            authorHandle,
          },
          bookmarkedAt: bookmark.createdAt,
        };
      })
    );

    return results.filter((r) => r !== null);
  },
});