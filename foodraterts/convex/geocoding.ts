import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive app statistics for admin dashboard
 */
export const getAppStatistics = query({
  args: {},
  handler: async (ctx) => {
    // Count total restaurants
    const restaurants = await ctx.db.query("restaurants").collect();

    // Count total reviews
    const reviews = await ctx.db.query("itemReviews").collect();

    // Count total users
    const users = await ctx.db.query("users").collect();

    // Count total menu items
    const menuItems = await ctx.db.query("menuItems").collect();

    // Count total tweets/social posts
    const tweets = await ctx.db.query("tweets").collect();

    // Count total conversations
    const conversations = await ctx.db.query("conversations").collect();

    // Count total messages
    const messages = await ctx.db.query("messages").collect();

    // Count total follows
    const follows = await ctx.db.query("follows").collect();

    // Count total notifications
    const notifications = await ctx.db.query("notifications").collect();

    // Count restaurant visits
    const visits = await ctx.db.query("restaurantVisits").collect();

    return {
      totalRestaurants: restaurants.length,
      totalReviews: reviews.length,
      totalUsers: users.length,
      totalMenuItems: menuItems.length,
      totalTweets: tweets.length,
      totalConversations: conversations.length,
      totalMessages: messages.length,
      totalFollows: follows.length,
      totalNotifications: notifications.length,
      totalVisits: visits.length,
    };
  },
});

/**
 * Update restaurant with coordinates and zipcode (mutation)
 * Used by restaurant geocoding functions
 */
export const updateRestaurantCoordinates = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    lat: v.number(),
    lng: v.number(),
    zipcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.restaurantId, {
      lat: args.lat,
      lng: args.lng,
      ...(args.zipcode && { zipcode: args.zipcode }),
    });
    return { success: true };
  },
});