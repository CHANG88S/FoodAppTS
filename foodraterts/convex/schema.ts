import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({

  ...authTables,

  // 0. USERS & ROLES TABLE WITH FULL HIERARCHY
  users: defineTable({
    name: v.optional(v.string()),
    username: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()),
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
    displayedBadge: v.optional(v.string()),
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
    logoStorageId: v.optional(v.id("_storage")),
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
    imageStorageId: v.optional(v.id("_storage")),   
  })
    .index("by_restaurantId", ["restaurantId"])
    .searchIndex("search_item", {
      searchField: "itemName",
      filterFields: ["category"],
    }),

  // 3. GRANULAR USER REVIEWS
  itemReviews: defineTable({
    itemId: v.id("menuItems"),        
    userId: v.string(),
    overallRating: v.number(),  
    notes: v.string(),              
    granularAttributes: v.array(
      v.object({
        id: v.optional(v.string()),
        name: v.string(),
        value: v.union(v.number(), v.string()),
      })
    ),
    orderNotes: v.optional(v.string()),
    likes: v.optional(v.array(v.string())),
    comments: v.optional(
      v.array(
        v.object({
          commentId: v.string(),
          userId: v.string(),
          userName: v.string(),
          userHandle: v.string(),
          text: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    updateLikes: v.optional(v.array(v.string())),
    updateComments: v.optional(
      v.array(
        v.object({
          commentId: v.string(),
          userId: v.string(),
          userName: v.string(),
          userHandle: v.string(),
          text: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_itemId", ["itemId"])
    .index("by_user", ["userId"]),

  // 4. SOCIAL TWEETS / ACTIVITY FEED POSTS
  tweets: defineTable({
    body: v.string(),
    userId: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    likes: v.optional(v.array(v.string())),
    comments: v.optional(
      v.array(
        v.object({
          _id: v.string(),
          userId: v.string(),
          body: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // 5. RESTAURANT VISITS / CHECK-INS TRACKER
  restaurantVisits: defineTable({
    userId: v.string(),
    restaurantId: v.id("restaurants"),
    timestamp: v.number(),
  })
    .index("by_user_and_restaurant", ["userId", "restaurantId"]),
});