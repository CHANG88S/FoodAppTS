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
        favoriteColor: v.optional(v.string()),
        favoriteCuisines: v.optional(v.array(v.string())),
        dietaryRestrictions: v.optional(v.array(v.string())),
        spiceTolerance: v.optional(v.string()),
      })
    ),
    displayedBadge: v.optional(v.string()),
    lastCheckedMessagesAt: v.optional(v.number()),
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
    zipcode: v.optional(v.string()),
    phone: v.optional(v.string()),
    hours: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    status: v.optional(v.string()),
    website: v.optional(v.string()),
    mapsLocation: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    chainRestaurantId: v.optional(v.id("restaurants")), // For chain locations - references parent/original location
    isChainLocation: v.optional(v.boolean()), // Flag to indicate if this is part of a chain
  })
    .index("by_restaurantName", ["restaurantName"])
    .index("by_state_and_city", ["state", "city"])
    .index("by_chainRestaurantId", ["chainRestaurantId"]),

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
    copiedFromChainId: v.optional(v.id("restaurants")), // Track if this was copied from a chain location
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
    imageStorageId: v.optional(v.id("_storage")),
    originalImageStorageId: v.optional(v.id("_storage")), // Track image at creation time
    updatedImageStorageId: v.optional(v.id("_storage")), // Track image added during update
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

  // 6. SOCIAL FOLLOW SYSTEM
  follows: defineTable({
    followerId: v.string(), // User who is following
    followingId: v.string(), // User being followed
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follow_pair", ["followerId", "followingId"]),

  // 7. NOTIFICATIONS
  notifications: defineTable({
    recipientId: v.string(), // User who receives notification
    senderId: v.string(), // User who triggered it
    type: v.union(
      v.literal("follow"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("suggestion")
    ),
    targetType: v.union(
      v.literal("tweet"),
      v.literal("review"),
      v.literal("user"),
      v.literal("suggestion")
    ),
    targetId: v.optional(v.string()), // ID of liked tweet, commented review, etc. (stored as string for flexibility)
    message: v.optional(v.string()), // Custom message (e.g., comment text)
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_and_read", ["recipientId", "isRead"]),

  // 8. MESSAGING - CONVERSATIONS
  conversations: defineTable({
    participant1Id: v.string(), // First participant (for 1:1 DMs)
    participant2Id: v.string(), // Second participant (for 1:1 DMs)
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_participant1", ["participant1Id"])
    .index("by_participant2", ["participant2Id"]),

  // 9. MESSAGING - MESSAGES
  messages: defineTable({
    conversationId: v.string(), // Reference to conversations table
    senderId: v.string(),
    content: v.string(), // Text content
    imageStorageId: v.optional(v.id("_storage")), // Optional image
    isUnsent: v.boolean(), // True if message was unsent
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_and_created", ["conversationId", "createdAt"]),

  // 10. PLACE SUGGESTIONS (for moderation queue)
  placeSuggestions: defineTable({
    suggestedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    restaurantName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    mapsLocation: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_suggester", ["suggestedBy"]),

  // 11. MENU ITEM SUGGESTIONS (for moderation queue)
  menuItemSuggestions: defineTable({
    suggestedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    itemName: v.string(),
    category: v.optional(v.union(v.string(), v.array(v.string()))),
    price: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_suggester", ["suggestedBy"])
    .index("by_restaurantId", ["restaurantId"]),
});