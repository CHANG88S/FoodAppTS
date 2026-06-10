import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Directory of individual food/drink items across different locations
  menuItems: defineTable({
    placeId: v.string(),         // Unique Google Maps/Venue ID
    restaurantName: v.string(),  // e.g., "Orobae" or "Desouro"
    itemName: v.string(),        // e.g., "Boba Milk Tea"
    category: v.string(),        // "Drink" or "Food"
    
    // Metadata for user convenience
    price: v.optional(v.number()),      // Item price (e.g., 6.25)
    imageUrl: v.optional(v.string()),   // Direct URL to item photo
    logoUrl: v.optional(v.string()),    // Direct URL to restaurant logo
    website: v.optional(v.string()),    // Restaurant website link
  })
    .index("by_placeId", ["placeId"])
    // Enables full-text search directly on the item's name
    .searchIndex("search_item", {
      searchField: "itemName",
      filterFields: ["category"],
    }),

  // Granular user reviews tied back to specific menu items
  itemReviews: defineTable({
    itemId: v.id("menuItems"),
    userId: v.string(),         // Tied to Convex Auth sessions
    overallRating: v.number(),  // Supports custom 0.5 - 5.0 step ratings
    notes: v.string(),          // Review comments/notes
    
    // Dynamic array tracking slider matrix metrics (Flavor, Freshness, Value)
    granularAttributes: v.array(
      v.object({
        name: v.string(),
        value: v.number(),      // 1 - 5 score
      })
    ),
  }).index("by_itemId", ["itemId"]),
});