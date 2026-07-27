import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to submit a review.");

    const existing = await ctx.db
      .query("itemReviews")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("itemId"), args.itemId)
        )
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("itemReviews", {
        itemId: args.itemId,
        userId: userId,
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const deleteItemReview = mutation({
  args: { reviewId: v.id("itemReviews") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const review = await ctx.db.get(args.reviewId);
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized.");
    }

    await ctx.db.delete(args.reviewId);
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

    const enrichedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        const item: any = await ctx.db.get(review.itemId);
        const restaurant: any = item?.restaurantId ? await ctx.db.get(item.restaurantId) : null;

        const createdAt = review.createdAt || 0;
        const updatedAt = review.updatedAt || 0;

        return {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "",
          isUpdated: updatedAt > createdAt + 1000,
        };
      })
    );

    return enrichedReviews;
  },
});