import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const submitItemReview = mutation({
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
    overallRating: v.number(),
    notes: v.string(),
    granularAttributes: v.array(
      v.object({ name: v.string(), value: v.union(v.number(), v.string()) })
    ),
    price: v.optional(v.number()),  
    imageStorageId: v.optional(v.id("_storage")), // 🔑 Replaced imageUrl with storage ID
    orderNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to submit a review.");

    // 1. Check if this specific item has already been created at this restaurant location
    let item = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("itemName"), args.itemName))
      .unique();

    // 2. If it's a completely new drink/dish, insert it into the menu directory
    if (!item) {
      const itemId = await ctx.db.insert("menuItems", {
        restaurantId: args.restaurantId,
        restaurantName: args.restaurantName,
        itemName: args.itemName,
        category: args.category,
        price: args.price,
        imageStorageId: args.imageStorageId,
      });
      item = await ctx.db.get(itemId);
    } else {
      // If the item already exists, patch its metadata with updated prices/storage IDs if provided
      await ctx.db.patch(item._id, {
        price: args.price ?? item.price,
        imageStorageId: args.imageStorageId ?? item.imageStorageId,
      });
    }

    const now = Date.now();

    // 3. Save the user's detailed score layout bound cleanly to the menu item ID
    const reviewId = await ctx.db.insert("itemReviews", {
      itemId: item!._id,
      userId: userId, 
      overallRating: args.overallRating,
      notes: args.notes,
      granularAttributes: args.granularAttributes,
      orderNotes: args.orderNotes,
      likes: [],
      comments: [],
      updateLikes: [],
      updateComments: [],
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, itemId: item!._id, reviewId };
  },
});