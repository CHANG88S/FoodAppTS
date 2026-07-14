import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const searchMenuItems = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery === "") {
      return [];
    }

    // Direct, case-insensitive lookup optimized by your searchIndex definition
    const results = await ctx.db
      .query("menuItems")
      .withSearchIndex("search_item", (q) => 
        q.search("itemName", args.searchQuery)
      )
      .take(15); // Return top 15 results for efficient UI loading

    return results;
  },
});

export const addMenuItem = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(), // Saved in item table for your flat UI rendering speed
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
    userId: v.string(), 
  },
  handler: async (ctx, args) => {
    // ... your insertion logic
  }
});