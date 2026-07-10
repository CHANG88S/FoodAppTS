import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 1. LIST ALL RESTAURANTS - Returns restaurants filtered by city and state, or all if none provided
 * Normalizes inputs to bypass trailing database whitespace strings safely.
 */
export const listAllRestaurants = query({
  args: { 
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  }, 
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    // If no filter is applied, or "All" is chosen, return everything
    if (!args.cityFilter || !args.stateFilter || args.cityFilter === "All") {
      return allRestaurants;
    }

    const targetCity = args.cityFilter.trim().toLowerCase();
    const targetState = args.stateFilter.trim().toLowerCase();

    // Filter programmatically to catch database strings containing hidden spaces
    return allRestaurants.filter((shop) => {
      const shopCity = shop.city?.trim().toLowerCase();
      const shopState = shop.state?.trim().toLowerCase();
      return shopCity === targetCity && shopState === targetState;
    });
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
 * 5. GET RESTAURANT DETAILS & MENU ITEMS 
 * Fetches core restaurant data and cross-references its linked items from your database
 */
export const getRestaurantDetails = query({
  args: { 
    restaurantId: v.id("restaurants"),
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Fetch the restaurant metadata by its direct Document ID
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) return null;

    // Robust trim validation guard to ensure profile matches location safely
    if (args.cityFilter && args.stateFilter && args.cityFilter !== "All") {
      const targetCity = args.cityFilter.trim().toLowerCase();
      const targetState = args.stateFilter.trim().toLowerCase();
      const shopCity = restaurant.city?.trim().toLowerCase();
      const shopState = restaurant.state?.trim().toLowerCase();

      if (shopCity !== targetCity || shopState !== targetState) {
        return null; 
      }
    }

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