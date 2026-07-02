import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitItemReview = mutation({
  args: {
    restaurantId: v.id("restaurants"), 
    restaurantName: v.string(),        // 🔥 FIX: Added required schema text field
    itemName: v.string(),
    category: v.string(),              // 🔥 FIX: Made required to match your item search index rules
    overallRating: v.number(),
    notes: v.string(),
    granularAttributes: v.array(
      v.object({ name: v.string(), value: v.number() })
    ),
    price: v.optional(v.number()),  
    imageUrl: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
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
        imageUrl: args.imageUrl,
      });
      item = await ctx.db.get(itemId);
    } else {
      // If the item already exists, patch its metadata with updated prices/images if provided
      await ctx.db.patch(item._id, {
        price: args.price ?? item.price,
        imageUrl: args.imageUrl ?? item.imageUrl,
      });
    }

    // 3. Save the user's detailed score layout bound cleanly to the menu item ID
    const reviewId = await ctx.db.insert("itemReviews", {
      itemId: item!._id,
      userId: "guest_user", 
      overallRating: args.overallRating,
      notes: args.notes,
      granularAttributes: args.granularAttributes,
    });

    return { success: true, itemId: item!._id, reviewId };
  },
});