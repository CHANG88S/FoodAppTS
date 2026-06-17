import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * 1. EXACT MATCH LOOKUP
 * Returns a single restaurant document matching the exact capitalization and text.
 */
export const getRestaurantByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) => q.eq("restaurantName", args.name))
      .unique(); // Grabs the single unique entry
  },
});

/**
 * 2. FUZZY SEARCH BAR LOOKUP
 * Returns an array of restaurants that match a partial text entry.
 */
export const searchRestaurantsByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.trim() === "") {
      return await ctx.db.query("restaurants").collect(); // Return everything if search empty
    }

    // Filters down the table list matching partial text entries natively
    return await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) =>
        q
          .gte("restaurantName", args.searchTerm)
          .lte("restaurantName", args.searchTerm + "\uffff")
      )
      .collect();
  },
});