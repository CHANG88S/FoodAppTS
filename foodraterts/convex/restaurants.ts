import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
          logoStorageId: restaurant.logoStorageId 
            ? await ctx.storage.getUrl(restaurant.logoStorageId) 
            : null,
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
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
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

    const logoStorageId = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : null;

    return {
      ...restaurant,
      logoStorageId,
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
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
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
        logoStorageId: restaurant.logoStorageId 
          ? await ctx.storage.getUrl(restaurant.logoStorageId) 
          : null,
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
          : null;

        return {
          ...item,
          imageUrl: resolvedImageUrl,
          averageRating,
          reviewCount: reviews.length,
        };
      })
    );

    const resolvedLogoStorageId = restaurant.logoStorageId 
      ? await ctx.storage.getUrl(restaurant.logoStorageId) 
      : null;

    // Stitch them into a single unified object for your layout grid to ingest smoothly
    return {
      ...restaurant,
      logoStorageId: resolvedLogoStorageId,
      menuItems: menuItemsWithRatings,
    };
  },
});

/**
 * 6. CHECK IF USER HAS REVIEWED RESTAURANT - Validates if logged in user has reviewed any item here
 */
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

/**
 * 7. GET VISIT COUNT FOR RESTAURANT - Returns total check-ins for a restaurant
 */
export const getVisitCount = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("restaurantVisits")
      .filter((q) => q.eq(q.field("restaurantId"), args.restaurantId))
      .collect();

    // Count unique users who've visited
    const uniqueVisitors = new Set(visits.map((v) => v.userId));
    return {
      totalVisits: visits.length,
      uniqueVisitors: uniqueVisitors.size,
    };
  },
});

/**
 * 8. GET ALL RESTAURANTS WITH VISIT COUNTS - Returns restaurants with visit statistics
 */
export const listAllRestaurantsWithVisits = query({
  args: {
    cityFilter: v.optional(v.string()),
    stateFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allRestaurants = await ctx.db.query("restaurants").collect();

    // If no filter is applied, or "All" is chosen, return everything
    const restaurantsToReturn = !args.cityFilter || !args.stateFilter || args.cityFilter === "All"
      ? allRestaurants
      : allRestaurants.filter((shop) => {
          const targetCity = args.cityFilter!.trim().toLowerCase();
          const targetState = args.stateFilter!.trim().toLowerCase();
          const shopCity = shop.city?.trim().toLowerCase();
          const shopState = shop.state?.trim().toLowerCase();
          return shopCity === targetCity && shopState === targetState;
        });

    // Fetch visit counts for all restaurants
    const restaurantsWithVisits = await Promise.all(
      restaurantsToReturn.map(async (restaurant) => {
        const visits = await ctx.db
          .query("restaurantVisits")
          .filter((q) => q.eq(q.field("restaurantId"), restaurant._id))
          .collect();

        const uniqueVisitors = new Set(visits.map((v) => v.userId));

        return {
          ...restaurant,
          logoStorageId: restaurant.logoStorageId
            ? await ctx.storage.getUrl(restaurant.logoStorageId)
            : null,
          visitCount: visits.length,
          uniqueVisitorCount: uniqueVisitors.size,
        };
      })
    );

    return restaurantsWithVisits;
  },
});

/**
 * 9. RECORD VISIT - Logs a user check-in with a daily limit of 3 visits per restaurant
 */
export const recordVisit = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to record a visit.");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayVisits = await ctx.db
      .query("restaurantVisits")
      .withIndex("by_user_and_restaurant", (q) => 
        q.eq("userId", userId).eq("restaurantId", args.restaurantId)
      )
      .filter((q) => q.gte(q.field("timestamp"), startOfDay.getTime()))
      .collect();

    if (todayVisits.length >= 3) {
      throw new Error("You have already checked into this place 3 times today!");
    }

    return await ctx.db.insert("restaurantVisits", {
      userId,
      restaurantId: args.restaurantId,
      timestamp: Date.now(),
    });
  },
});