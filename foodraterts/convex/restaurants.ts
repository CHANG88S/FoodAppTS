import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 1. LIST ALL RESTAURANTS - Returns all restaurants for home screen display
 */
export const listAllRestaurants = query({
  args: {}, 
  handler: async (ctx) => {
    return await ctx.db.query("restaurants").collect();
  },
});

/**
 * 2. EXACT MATCH LOOKUP - Find a restaurant by exact name match for detail pages
 */
export const getRestaurantByName = query({
  args: { name: v.string() }, 
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) => q.eq("restaurantName", args.name))
      .unique(); 
  },
});

/**
 * 3. SIMPLE SEARCH - Case-insensitive filter on restaurant names
 */
export const searchRestaurantsByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm || !args.searchTerm.trim()) {
      return await ctx.db.query("restaurants").collect(); 
    }

    const lowerSearch = args.searchTerm.toLowerCase().trim();
    const allRestaurants = await ctx.db.query("restaurants").collect();

    // Filter in JS for true case-insensitive substring matching
    return allRestaurants
      .filter((r) => r.restaurantName.toLowerCase().includes(lowerSearch))
      .slice(0, 15);
  },
});

/**
 * 4. PREFIX SEARCH ALL RESTAURANTS - Case insensitive prefix matching
 */
export const searchAllByName = query({
  args: { namePattern: v.string() }, 
  handler: async (ctx, args) => {
    if (!args.namePattern || !args.namePattern.trim()) {
      return await ctx.db.query("restaurants").collect();
    }

    const pattern = args.namePattern.toLowerCase().trim(); 
    const allRestaurants = await ctx.db.query("restaurants").collect();

    // Mimics the 'pattern%' behavior securely using .startsWith()
    return allRestaurants
      .filter((r) => r.restaurantName.toLowerCase().startsWith(pattern))
      .slice(0, 25);
  },
});

/**
 * 🔥 5. GET RESTAURANT DETAILS & MENU ITEMS (ADDED)
 * Fetches the core restaurant data and cross-references its linked items from your database
 */
export const getRestaurantDetails = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    // Fetch the restaurant metadata by its direct Document ID
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) return null;

    // Fast indexed query to grab all drinks/dishes matching this restaurantId
    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    // Stitch them into a single unified object for your layout grid to ingest smoothly
    return {
      ...restaurant,
      menuItems,
    };
  },
});