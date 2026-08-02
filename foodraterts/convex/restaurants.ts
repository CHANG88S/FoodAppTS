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
      return Promise.all(
        allRestaurants.map(async (restaurant) => ({
          ...restaurant,
          logoUrl: restaurant.logoStorageId 
            ? await ctx.storage.getUrl(restaurant.logoStorageId) 
            : restaurant.logoUrl,
        }))
      );
    }

    const targetCity = args.cityFilter.trim().toLowerCase();
    const targetState = args.stateFilter.trim().toLowerCase();

    // Filter programmatically to catch database strings containing hidden spaces
    const filtered = allRestaurants.filter((shop) => {
      const shopCity = shop.city?.trim().toLowerCase();
      const shopState = shop.state?.trim().toLowerCase();
      return shopCity === targetCity && shopState === targetState;
    });

    return Promise.all(
      filtered.map(async (restaurant) => ({
        ...restaurant,
        logoUrl: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : restaurant.logoUrl,
      }))
    );
  },
});

/**
 * 2. EXACT MATCH LOOKUP - Find a restaurant by exact name match for detail pages
 */
export const getRestaurantByName = query({
  args: { name: v.string() }, 
  handler: async (ctx, args) => {
    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) => q.eq("restaurantName", args.name))
      .unique(); 

    if (!restaurant) return null;

    const logoUrl = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : restaurant.logoUrl;

    return {
      ...restaurant,
      logoUrl,
    };
  },
});

/**
 * 3. SIMPLE SEARCH - Case-insensitive filter on restaurant names
 */
export const searchRestaurantsByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    let results = allRestaurants;
    if (args.searchTerm && args.searchTerm.trim()) {
      const lowerSearch = args.searchTerm.toLowerCase().trim();
      results = allRestaurants
        .filter((r) => r.restaurantName.toLowerCase().includes(lowerSearch))
        .slice(0, 15);
    }

    return Promise.all(
      results.map(async (restaurant) => ({
        ...restaurant,
        logoUrl: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : restaurant.logoUrl,
      }))
    );
  },
});

/**
 * 4. PREFIX SEARCH ALL RESTAURANTS - Case insensitive prefix matching
 */
export const searchAllByName = query({
  args: { namePattern: v.string() }, 
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    let results = allRestaurants;
    if (args.namePattern && args.namePattern.trim()) {
      const pattern = args.namePattern.toLowerCase().trim(); 
      results = allRestaurants
        .filter((r) => r.restaurantName.toLowerCase().startsWith(pattern))
        .slice(0, 25);
    }

    return Promise.all(
      results.map(async (restaurant) => ({
        ...restaurant,
        logoUrl: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : restaurant.logoUrl,
      }))
    );
  },
});

/**
 * 5. GET RESTAURANT DETAILS & MENU ITEMS WITH LIVE RATINGS
 * Fetches core restaurant data, cross-references linked items, and computes average review ratings.
 */
export const getRestaurantDetails = query({
  args: { 
    restaurantId: v.optional(v.id("restaurants")), // 🔑 Made optional to prevent errors when uninitialized
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🔑 Safely return null if restaurantId hasn't loaded or been passed yet
    if (!args.restaurantId) {
      return null;
    }

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
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId!))
      .collect();

    // Compute average ratings and resolve storage image URLs for each menu item dynamically
    const menuItemsWithRatings = await Promise.all(
      menuItems.map(async (item) => {
        const reviews = await ctx.db
          .query("itemReviews")
          .withIndex("by_itemId", (q) => q.eq("itemId", item._id))
          .collect();

        let averageRating = 0.0;
        if (reviews.length > 0) {
          const totalScore = reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0);
          averageRating = Number((totalScore / reviews.length).toFixed(1));
        }

        const resolvedImageUrl = item.imageStorageId 
          ? await ctx.storage.getUrl(item.imageStorageId) 
          : item.imageUrl;

        return {
          ...item,
          imageUrl: resolvedImageUrl,
          averageRating,
          reviewCount: reviews.length,
        };
      })
    );

    const resolvedLogoUrl = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : restaurant.logoUrl;

    // Stitch them into a single unified object for your layout grid to ingest smoothly
    return {
      ...restaurant,
      logoUrl: resolvedLogoUrl,
      menuItems: menuItemsWithRatings,
    };
  },
});