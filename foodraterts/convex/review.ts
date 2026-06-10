import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitItemReview = mutation({
  args: {
    placeId: v.string(),
    restaurantName: v.string(),
    itemName: v.string(),
    category: v.string(),
    overallRating: v.number(),
    notes: v.string(),
    granularAttributes: v.array(
      v.object({ name: v.string(), value: v.number() })
    ),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if this specific item has already been created at this location
    let item = await ctx.db
      .query("menuItems")
      .withIndex("by_placeId", (q) => q.eq("placeId", args.placeId))
      .filter((q) => q.eq(q.field("name"), args.itemName))
      .unique();

    // 2. If it's a completely new item, insert it into the directory
    if (!item) {
      const itemId = await ctx.db.insert("menuItems", {
        placeId: args.placeId,
        restaurantName: args.restaurantName,
        itemName: args.itemName,
        category: args.category,
        price: args.price,
        imageUrl: args.imageUrl,
        logoUrl: args.logoUrl,
        website: args.website,
      });
      item = await ctx.db.get(itemId);
    } else {
      // If the item exists but lacks convenient info, patch it in
      await ctx.db.patch(item._id, {
        price: args.price ?? item.price,
        imageUrl: args.imageUrl ?? item.imageUrl,
        logoUrl: args.logoUrl ?? item.logoUrl,
        website: args.website ?? item.website,
      });
    }

    // 3. Save the user's detailed score layout bound to the item ID
    const reviewId = await ctx.db.insert("itemReviews", {
      itemId: item!._id,
      userId: "guest_user", // Link to real user session identity later
      overallRating: args.overallRating,
      notes: args.notes,
      granularAttributes: args.granularAttributes,
    });

    return { success: true, reviewId };
  },
});