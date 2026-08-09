import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireStaff } from "./authz";

export const searchMenuItems = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery === "") return [];
    return await ctx.db
      .query("menuItems")
      .withSearchIndex("search_item", (q) => q.search("itemName", args.searchQuery))
      .take(15);
  },
});

export const addMenuItem = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    itemName: v.string(),
    category: v.optional(v.union(v.string(), v.array(v.string()))),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Staff-only: regular users should use suggestMenuItem instead
    await requireStaff(ctx);

    const existingItem = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("itemName"), args.itemName))
      .first();

    if (existingItem) {
      return existingItem._id;
    }

    return await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      itemName: args.itemName,
      category: args.category,
      price: args.price,
    });
  },
});

export const createItemReview = mutation({
  args: {
    itemId: v.id("menuItems"),
    overallRating: v.number(),
    notes: v.string(),
    criteriaList: v.array(
      v.object({
        id: v.optional(v.string()),
        name: v.string(),
        value: v.union(v.number(), v.string()),
      })
    ),
    orderNotes: v.optional(v.string()),
    editReviewId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to submit a review.");

    const now = Date.now();

    if (args.editReviewId) {
      const cleanId = args.editReviewId.split("-")[0] as any;
      const reviewToUpdate: any = await ctx.db.get(cleanId);
      if (reviewToUpdate && reviewToUpdate.userId === userId) {
        await ctx.db.patch(cleanId, {
          overallRating: args.overallRating,
          notes: args.notes,
          granularAttributes: args.criteriaList,
          orderNotes: args.orderNotes,
          updatedAt: now,
        });
        return cleanId;
      }
    }

    const existingReview = await ctx.db
      .query("itemReviews")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingReview) {
      await ctx.db.patch(existingReview._id, {
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        updatedAt: now,
      });
      return existingReview._id;
    } else {
      const newReviewId = await ctx.db.insert("itemReviews", {
        itemId: args.itemId,
        userId: userId,
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        likes: [],
        comments: [],
        updateLikes: [],
        updateComments: [],
        createdAt: now,
        updatedAt: now,
      });
      return newReviewId;
    }
  },
});

export const deleteItemReview = mutation({
  args: { reviewId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized.");
    }

    await ctx.db.delete(actualId);
    return true;
  },
});

export const toggleLikeReview = mutation({
  args: { 
    reviewId: v.string(),
    activityType: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const likes = isUpdate ? (review.updateLikes || []) : (review.likes || []);
    const hasLiked = likes.includes(userId);

    const updatedLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    if (isUpdate) {
      await ctx.db.patch(actualId, { updateLikes: updatedLikes });
    } else {
      await ctx.db.patch(actualId, { likes: updatedLikes });
    }

    return !hasLiked;
  },
});

export const addCommentToReview = mutation({
  args: { 
    reviewId: v.string(), 
    text: v.string(),
    activityType: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user: any = await ctx.db.get(userId as any);
    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const comments = isUpdate ? (review.updateComments || []) : (review.comments || []);
    
    const newComment = {
      commentId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      userName: user?.name || user?.username || "User",
      userHandle: user?.username ? `@${user.username}` : "@user",
      text: args.text,
      createdAt: Date.now(),
    };

    if (isUpdate) {
      await ctx.db.patch(actualId, {
        updateComments: [...comments, newComment],
      });
    } else {
      await ctx.db.patch(actualId, {
        comments: [...comments, newComment],
      });
    }

    return newComment;
  },
});

export const deleteCommentFromReview = mutation({
  args: { 
    reviewId: v.string(), 
    commentId: v.string(),
    activityType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const comments = isUpdate ? (review.updateComments || []) : (review.comments || []);
    const targetComment = comments.find((c: any) => c.commentId === args.commentId);

    if (!targetComment || targetComment.userId !== userId) {
      throw new Error("Unauthorized to delete this comment");
    }

    const updatedComments = comments.filter((c: any) => c.commentId !== args.commentId);
    if (isUpdate) {
      await ctx.db.patch(actualId, { updateComments: updatedComments });
    } else {
      await ctx.db.patch(actualId, { comments: updatedComments });
    }
    return true;
  },
});

export const getUserReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reviews = await ctx.db
      .query("itemReviews")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const activities: any[] = [];

    await Promise.all(
      reviews.map(async (review: any) => {
        const item: any = await ctx.db.get(review.itemId);
        const restaurant: any = item?.restaurantId ? await ctx.db.get(item.restaurantId) : null;

        // Fetch total visits for this restaurant by this user, defaulting to at least 1 visit
        let actualVisits = 0;
        if (restaurant && restaurant._id) {
          const visits = await ctx.db
            .query("restaurantVisits")
            .withIndex("by_user_and_restaurant", (q) => 
              q.eq("userId", userId).eq("restaurantId", restaurant._id)
            )
            .collect();
          actualVisits = visits.length;
        }

        const visitCount = Math.max(1, actualVisits);

        const createdAt = review.createdAt || review._creationTime || 0;
        const updatedAt = review.updatedAt || createdAt;
        const hasBeenUpdated = updatedAt > createdAt + 1000;

        const baseData = {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "",
          visitCount,
        };

        // 1. Initial creation entry
        activities.push({
          ...baseData,
          _id: review._id,
          uniqueKey: `${review._id}-created`,
          activityType: "rated",
          timestamp: createdAt,
          likes: review.likes || [],
          comments: review.comments || [],
        });

        // 2. Separate independent entry for updates
        if (hasBeenUpdated) {
          activities.push({
            ...baseData,
            _id: review._id,
            uniqueKey: `${review._id}-updated`,
            activityType: "updated",
            timestamp: updatedAt,
            likes: review.updateLikes || [],
            comments: review.updateComments || [],
          });
        }
      })
    );

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  },
});

export const getUserReviewsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    const reviews = await ctx.db
      .query("itemReviews")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const activities: any[] = [];

    await Promise.all(
      reviews.map(async (review: any) => {
        const item: any = await ctx.db.get(review.itemId);
        const restaurant: any = item?.restaurantId ? await ctx.db.get(item.restaurantId) : null;

        // Fetch total visits for this restaurant by this user, defaulting to at least 1 visit
        let actualVisits = 0;
        if (restaurant && restaurant._id) {
          const visits = await ctx.db
            .query("restaurantVisits")
            .withIndex("by_user_and_restaurant", (q) =>
              q.eq("userId", userId).eq("restaurantId", restaurant._id)
            )
            .collect();
          actualVisits = visits.length;
        }

        const visitCount = Math.max(1, actualVisits);

        const createdAt = review.createdAt || review._creationTime || 0;
        const updatedAt = review.updatedAt || createdAt;
        const hasBeenUpdated = updatedAt > createdAt + 1000;

        const baseData = {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "",
          visitCount,
        };

        // 1. Initial creation entry
        activities.push({
          ...baseData,
          _id: review._id,
          uniqueKey: `${review._id}-created`,
          activityType: "rated",
          timestamp: createdAt,
          likes: review.likes || [],
          comments: review.comments || [],
        });

        // 2. Separate independent entry for updates
        if (hasBeenUpdated) {
          activities.push({
            ...baseData,
            _id: review._id,
            uniqueKey: `${review._id}-updated`,
            activityType: "updated",
            timestamp: updatedAt,
            likes: review.updateLikes || [],
            comments: review.updateComments || [],
          });
        }
      })
    );

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  },
});

export const userHasReviewedRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const itemIds = menuItems.map((item) => item._id);
    if (itemIds.length === 0) return false;

    for (const itemId of itemIds) {
      const review = await ctx.db
        .query("itemReviews")
        .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      
      if (review) return true;
    }

    return false;
  },
});