import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const submitItemReview = mutation({
  args: {
    restaurantId: v.id("restaurants"), 
    restaurantName: v.string(),        
    itemName: v.string(),
    category: v.optional(
      v.union(
        v.string(), 
        v.array(v.string())
      )
    ),                    
    overallRating: v.number(),
    notes: v.string(),
    granularAttributes: v.array(
      v.object({ name: v.string(), value: v.union(v.number(), v.string()) })
    ),
    price: v.optional(v.number()),  
    imageStorageId: v.optional(v.id("_storage")), 
    orderNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to submit a review.");

    // 1. Check if this specific item has already been created at this restaurant location
    let item = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("itemName"), args.itemName))
      .unique();

    // 2. If it's a completely new drink/dish, insert it into the menu directory
    if (!item) {
      const itemId = await ctx.db.insert("menuItems", {
        restaurantId: args.restaurantId,
        restaurantName: args.restaurantName,
        itemName: args.itemName,
        category: args.category,
        price: args.price,
        imageStorageId: args.imageStorageId,
      });
      item = await ctx.db.get(itemId);
    } else {
      // If the item already exists, patch its metadata with updated prices/storage IDs if provided
      await ctx.db.patch(item._id, {
        price: args.price ?? item.price,
        imageStorageId: args.imageStorageId ?? item.imageStorageId,
      });
    }

    const now = Date.now();

    // 3. Save the user's detailed score layout bound cleanly to the menu item ID
    const reviewId = await ctx.db.insert("itemReviews", {
      itemId: item!._id,
      userId: userId, 
      overallRating: args.overallRating,
      notes: args.notes,
      granularAttributes: args.granularAttributes,
      orderNotes: args.orderNotes,
      likes: [],
      comments: [],
      updateLikes: [],
      updateComments: [],
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, itemId: item!._id, reviewId };
  },
});

// Toggle like on a review
export const toggleLikeReview = mutation({
  args: { reviewId: v.id("itemReviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    const currentLikes = review.likes || [];
    const hasLiked = currentLikes.includes(userId);
    const updatedLikes = hasLiked
      ? currentLikes.filter((id: string) => id !== userId)
      : [...currentLikes, userId];

    await ctx.db.patch(args.reviewId, { likes: updatedLikes, updateLikes: updatedLikes });

    // Create notification for new like (if liking someone else's review)
    if (!hasLiked && review.userId !== userId) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: review.userId,
        senderId: userId,
        type: "like",
        targetType: "review",
        targetId: args.reviewId,
        message: undefined,
      });
    }
  },
});

// Add a comment to a review
export const addCommentToReview = mutation({
  args: {
    reviewId: v.id("itemReviews"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    // Get current user info for the comment
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const currentComments = review.comments || [];
    const newComment = {
      commentId: Math.random().toString(36).substring(2, 9),
      userId: userId,
      userName: user.name || user.username,
      userHandle: user.username,
      text: args.text,
      createdAt: Date.now(),
    };

    await ctx.db.patch(args.reviewId, {
      comments: [...currentComments, newComment],
      updateComments: [...currentComments, newComment],
    });

    // Create notification for comment (if commenting on someone else's review)
    if (review.userId !== userId) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: review.userId,
        senderId: userId,
        type: "comment",
        targetType: "review",
        targetId: args.reviewId,
        message: args.text,
      });
    }
  },
});

// Delete a comment from a review
export const deleteCommentFromReview = mutation({
  args: {
    reviewId: v.id("itemReviews"),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    const currentComments = review.comments || [];
    const updatedComments = currentComments.filter((c: any) => c.commentId !== args.commentId);

    await ctx.db.patch(args.reviewId, {
      comments: updatedComments,
      updateComments: updatedComments,
    });
  },
});