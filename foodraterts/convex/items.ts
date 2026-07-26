import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchMenuItems = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery === "") {
      return [];
    }

    const results = await ctx.db
      .query("menuItems")
      .withSearchIndex("search_item", (q) => 
        q.search("itemName", args.searchQuery)
      )
      .take(15);

    return results;
  },
});

export const addMenuItem = mutation({
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
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newItemId = await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      itemName: args.itemName,
      category: args.category,
      price: args.price,
    });
    return newItemId;
  },
});

export const createItemReview = mutation({
  args: {
    itemId: v.id("menuItems"),
    overallRating: v.number(),
    notes: v.string(),
    criteriaList: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        value: v.union(v.number(), v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to submit a review.");
    }

    const newReviewId = await ctx.db.insert("itemReviews", {
      itemId: args.itemId,
      userId: userId,
      overallRating: args.overallRating,
      notes: args.notes,
      granularAttributes: args.criteriaList,
    });

    return newReviewId;
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
      reviews.map(async (review) => {
        const item = await ctx.db.get(review.itemId);
        
        // Fetch the associated restaurant document from the restaurants table
        const restaurant = item?.restaurantId 
          ? await ctx.db.get(item.restaurantId) 
          : null;

        return {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "", // 🔑 Added state field here
        };
      })
    );

    return enrichedReviews;
  },
});