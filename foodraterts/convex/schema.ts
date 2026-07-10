import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. MASTER RESTAURANT DIRECTORY
  restaurants: defineTable({
    placeId: v.optional(v.string()),  
    restaurantName: v.string(),       
    category: v.optional(v.string()), 
    // 👇 Temporarily change these to v.optional so your deployment succeeds
    streetAddress: v.optional(v.string()),        
    city: v.optional(v.string()),                 
    state: v.optional(v.string()),                
    address: v.optional(v.string()),  
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    status: v.optional(v.string()),   
    website: v.optional(v.string()),
    mapsLocation: v.optional(v.string()),
  })
    .index("by_restaurantName", ["restaurantName"])
    .index("by_state_and_city", ["state", "city"]),

  // 2. INDIVIDUAL MENU ITEMS (DISHES/DRINKS)
  menuItems: defineTable({
    restaurantId: v.id("restaurants"), 
    restaurantName: v.string(),        // Kept for flat UI rendering speed
    itemName: v.string(),        
    category: v.string(),              // "Drink" or "Food"
    price: v.optional(v.number()),      
    imageUrl: v.optional(v.string()),   
  })
    .index("by_restaurantId", ["restaurantId"])
    .searchIndex("search_item", {
      searchField: "itemName",
      filterFields: ["category"],
    }),

  // 3. GRANULAR USER REVIEWS
  itemReviews: defineTable({
    itemId: v.id("menuItems"),         // Cleanly links up to the specific dish
    userId: v.string(),         
    overallRating: v.number(),  
    notes: v.string(),          
    granularAttributes: v.array(
      v.object({
        name: v.string(),
        value: v.number(),      
      })
    ),
  }).index("by_itemId", ["itemId"]),
});