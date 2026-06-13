import { v } from "convex/values";
import { query } from "./_generated/server";

// 🔥 FIX 1: Added this query so your Home.tsx tab can fetch your 20 boba shops!
export const listAllRestaurants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("restaurants").collect();
  },
});

// Your existing details query (Perfect as written!)
export const getRestaurantDetails = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) return null;

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    return {
      ...restaurant,
      menuItems,
    };
  },
});