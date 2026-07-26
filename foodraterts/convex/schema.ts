import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server"; // Import the auth tables from auth.ts

export default defineSchema({

  ...authTables, // Import the auth table from auth.ts


  // 0. USERS & ROLES TABLE WITH FULL HIERARCHY
  users: defineTable({
    name: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()), // 🔑 Make passwordHash optional
    profilePicture: v.optional(v.string()),
    city: v.optional(v.string()),
    role: v.union(
      v.literal("user"), 
      v.literal("moderator"), 
      v.literal("admin"), 
      v.literal("developer"), 
      v.literal("owner")
    ),
    preferences: v.optional(
      v.object({
        sweetness: v.optional(v.number()),
        iceLevel: v.optional(v.number()),
        milkBase: v.optional(v.string()),
        favoriteCuisines: v.optional(v.array(v.string())),
        dietaryRestrictions: v.optional(v.array(v.string())),
        spiceTolerance: v.optional(v.string()),
      })
    ),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // 1. MASTER RESTAURANT DIRECTORY
  restaurants: defineTable({
    placeId: v.optional(v.string()),  
    restaurantName: v.string(),       
    category: v.optional(v.string()),         
    city: v.string(),             
    state: v.string(),            
    address: v.string(),
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
    restaurantName: v.string(),        
    itemName: v.string(),        
    category: v.optional(
      v.union(
        v.string(), 
        v.array(v.string())
      )
    ),                 
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
    itemId: v.id("menuItems"),        
    userId: v.string(), // or v.id("users") depending on your setup
    overallRating: v.number(),  
    notes: v.string(),              
    granularAttributes: v.array(
      v.object({
        name: v.string(),
        value: v.union(v.number(), v.string()), // 🔑 Allow both numbers and strings
      })
    ),
  }).index("by_itemId", ["itemId"]),
});