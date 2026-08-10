import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireStaff } from "./authz";
import { api } from "./_generated/api";
import { createNotificationForSuggestion } from "./notifications";

// Helper function to find potential chain locations by name
async function findPotentialChains(ctx: any, restaurantName: string, currentCity: string, currentState: string) {
  const existing = await ctx.db
    .query("restaurants")
    .withIndex("by_restaurantName", (q: any) => q.eq("restaurantName", restaurantName))
    .collect();

  // Filter out the exact same location and return potential chain matches
  return existing.filter(
    (r: any) => r.city !== currentCity || r.state !== currentState
  );
}

// Helper function to copy menu items from one restaurant to another
async function copyMenuItems(ctx: any, fromRestaurantId: any, toRestaurantId: any, toRestaurantName: string) {
  const existingItems = await ctx.db
    .query("menuItems")
    .withIndex("by_restaurantId", (q: any) => q.eq("restaurantId", fromRestaurantId))
    .collect();

  const copiedItems = [];
  for (const item of existingItems) {
    // Check if item already exists at destination
    const existing = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q: any) => q.eq("restaurantId", toRestaurantId))
      .filter((q: any) => q.eq(q.field("itemName"), item.itemName))
      .first();

    if (!existing) {
      const newItemId = await ctx.db.insert("menuItems", {
        restaurantId: toRestaurantId,
        restaurantName: toRestaurantName,
        itemName: item.itemName,
        category: item.category,
        price: item.price,
        imageStorageId: item.imageStorageId,
        copiedFromChainId: fromRestaurantId,
      });
      copiedItems.push(newItemId);
    }
  }

  return copiedItems;
}

// ==================== PLACE SUGGESTIONS ====================

export const suggestPlace = mutation({
  args: {
    restaurantName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    phone: v.optional(v.string()),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to suggest a place");

    const mapsLocation =
      args.lat != null && args.lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${args.lat},${args.lng}`
        : undefined;

    return await ctx.db.insert("placeSuggestions", {
      suggestedBy: userId,
      status: "pending",
      restaurantName: args.restaurantName,
      address: args.address,
      city: args.city,
      state: args.state,
      phone: args.phone,
      category: args.category,
      website: args.website,
      lat: args.lat,
      lng: args.lng,
      mapsLocation,
      createdAt: Date.now(),
    });
  },
});

export const listPlaceSuggestions = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    const suggestions = await ctx.db
      .query("placeSuggestions")
      .withIndex("by_status", (q) =>
        q.eq("status", (args.status ?? "pending") as "pending" | "approved" | "rejected")
      )
      .order("desc")
      .take(50);

    return await Promise.all(
      suggestions.map(async (suggestion) => {
        const suggester = await ctx.db.get(suggestion.suggestedBy);
        return {
          ...suggestion,
          suggesterUsername: suggester?.username || "Unknown",
          suggesterName: suggester?.name,
        };
      })
    );
  },
});

// Query to check for potential chain locations when approving
export const checkPotentialChains = query({
  args: {
    restaurantName: v.string(),
    city: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) => q.eq("restaurantName", args.restaurantName))
      .collect();

    // Return locations with same name but different cities/states (potential chains)
    const potentialChains = existing.filter(
      (r) => r.city !== args.city || r.state !== args.state
    );

    return await Promise.all(
      potentialChains.map(async (r: any) => {
        const items = await ctx.db
          .query("menuItems")
          .withIndex("by_restaurantId", (q: any) => q.eq("restaurantId", r._id))
          .collect();
        return {
          ...r,
          menuItemCount: items.length
        };
      })
    );
  },
});

export const getMyPlaceSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("placeSuggestions")
      .withIndex("by_suggester", (q) => q.eq("suggestedBy", userId))
      .order("desc")
      .take(20);
  },
});

// New mutation to approve place suggestion with chain support
export const approvePlaceSuggestionWithChain = mutation({
  args: {
    suggestionId: v.id("placeSuggestions"),
    chainRestaurantId: v.optional(v.id("restaurants")),
    copyMenuItems: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireStaff(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") {
      throw new Error("Suggestion already processed");
    }

    // If no chainRestaurantId provided, check for potential chains first
    if (!args.chainRestaurantId) {
      const existing = await ctx.db
        .query("restaurants")
        .withIndex("by_restaurantName", (q: any) => q.eq("restaurantName", suggestion.restaurantName))
        .collect();

      const potentialChains = existing.filter(
        (r: any) => r.city !== suggestion.city || r.state !== suggestion.state
      );

      if (potentialChains.length > 0) {
        // Return chain information for modal display
        const chainsWithCounts = await Promise.all(
          potentialChains.map(async (r: any) => {
            const items = await ctx.db
              .query("menuItems")
              .withIndex("by_restaurantId", (q: any) => q.eq("restaurantId", r._id))
              .collect();
            return {
              ...r,
              menuItemCount: items.length
            };
          })
        );

        return {
          chainsFound: chainsWithCounts,
          needsConfirmation: true,
        };
      }
    }

    const placeId = `suggested:${suggestion._id}`;

    // Create the new restaurant with geocoding if coordinates not provided
    let lat = suggestion.lat;
    let lng = suggestion.lng;

    // If coordinates are not provided in suggestion, geocode the address
    if (!lat || !lng) {
      try {
        const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (mapboxToken) {
          const fullAddress = `${suggestion.address}, ${suggestion.city}, ${suggestion.state}, USA`;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const [longitude, latitude] = data.features[0].center;
              lat = latitude;
              lng = longitude;
            }
          }
        }
      } catch (error) {
        console.error("Geocoding failed during restaurant creation:", error);
        // Continue with restaurant creation even if geocoding fails
      }
    }

    // Create the new restaurant
    const newRestaurantId = await ctx.db.insert("restaurants", {
      placeId,
      restaurantName: suggestion.restaurantName,
      address: suggestion.address,
      city: suggestion.city,
      state: suggestion.state,
      phone: suggestion.phone,
      category: suggestion.category,
      website: suggestion.website,
      mapsLocation: suggestion.mapsLocation,
      chainRestaurantId: args.chainRestaurantId,
      isChainLocation: !!args.chainRestaurantId,
      // Include coordinates (from suggestion or from geocoding)
      lat,
      lng,
    });

    // Copy menu items if requested and chain restaurant provided
    let copiedItemsCount = 0;
    if (args.chainRestaurantId && args.copyMenuItems) {
      const copiedItems = await copyMenuItems(
        ctx,
        args.chainRestaurantId,
        newRestaurantId,
        suggestion.restaurantName
      );
      copiedItemsCount = copiedItems.length;
    }

    // Update suggestion status
    await ctx.db.patch(args.suggestionId, {
      status: "approved",
      reviewedBy: reviewer._id,
      reviewedAt: Date.now(),
      note: args.chainRestaurantId
        ? `Approved as chain location${copiedItemsCount > 0 ? ` with ${copiedItemsCount} menu items copied` : ""}`
        : undefined,
    });

    // Notify the suggester
    await createNotificationForSuggestion(ctx, {
      recipientId: suggestion.suggestedBy,
      senderId: reviewer._id,
      type: "suggestion" as any,
      targetType: "suggestion" as any,
      targetId: suggestion._id,
      message: args.chainRestaurantId
        ? `Your suggested place "${suggestion.restaurantName}" was approved as a chain location${copiedItemsCount > 0 ? ` with ${copiedItemsCount} menu items copied over!` : ""}!`
        : `Your suggested place "${suggestion.restaurantName}" was approved!`,
    });

    return {
      success: true,
      newRestaurantId,
      copiedItemsCount,
    };
  },
});

export const approvePlaceSuggestion = mutation({
  args: { suggestionId: v.id("placeSuggestions") },
  handler: async (ctx, args) => {
    const reviewer = await requireStaff(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") {
      throw new Error("Suggestion already processed");
    }

    const existing = await ctx.db
      .query("restaurants")
      .withIndex("by_restaurantName", (q) =>
        q.eq("restaurantName", suggestion.restaurantName)
      )
      .first();

    if (
      existing &&
      existing.address === suggestion.address &&
      existing.city === suggestion.city &&
      existing.state === suggestion.state
    ) {
      await ctx.db.patch(args.suggestionId, {
        status: "approved",
        reviewedBy: reviewer._id,
        reviewedAt: Date.now(),
        note: "Approved (already exists in database)",
      });
    } else {
      const placeId = `suggested:${suggestion._id}`;
      await ctx.db.insert("restaurants", {
        placeId,
        restaurantName: suggestion.restaurantName,
        address: suggestion.address,
        city: suggestion.city,
        state: suggestion.state,
        phone: suggestion.phone,
        category: suggestion.category,
        website: suggestion.website,
        mapsLocation: suggestion.mapsLocation,
      });

      await ctx.db.patch(args.suggestionId, {
        status: "approved",
        reviewedBy: reviewer._id,
        reviewedAt: Date.now(),
      });
    }

    // Notify the suggester
    await createNotificationForSuggestion(ctx, {
      recipientId: suggestion.suggestedBy,
      senderId: reviewer._id,
      type: "suggestion" as any,
      targetType: "suggestion" as any,
      targetId: suggestion._id,
      message: `Your suggested place "${suggestion.restaurantName}" was approved!`,
    });

    return { success: true };
  },
});

export const rejectPlaceSuggestion = mutation({
  args: {
    suggestionId: v.id("placeSuggestions"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireStaff(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") {
      throw new Error("Suggestion already processed");
    }

    await ctx.db.patch(args.suggestionId, {
      status: "rejected",
      reviewedBy: reviewer._id,
      reviewedAt: Date.now(),
      note: args.note,
    });

    // Notify the suggester using ctx.runMutation
    await ctx.runMutation(api.notifications.createNotificationInternal, {
      recipientId: suggestion.suggestedBy,
      senderId: reviewer._id,
      type: "suggestion" as any,
      targetType: "suggestion" as any,
      targetId: suggestion._id,
      message: args.note
        ? `Your suggested place "${suggestion.restaurantName}" was rejected. Note: ${args.note}`
        : `Your suggested place "${suggestion.restaurantName}" was rejected.`,
    });

    return { success: true };
  },
});

// ==================== MENU ITEM SUGGESTIONS ====================

export const suggestMenuItem = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    itemName: v.string(),
    category: v.optional(v.union(v.string(), v.array(v.string()))),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to suggest an item");

    return await ctx.db.insert("menuItemSuggestions", {
      suggestedBy: userId,
      status: "pending",
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      itemName: args.itemName,
      category: args.category,
      price: args.price,
      createdAt: Date.now(),
    });
  },
});

export const listMenuItemSuggestions = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    const statusToFilter = args.status ?? "pending";

    const suggestions = await ctx.db
      .query("menuItemSuggestions")
      .withIndex("by_status", (q) => q.eq("status", statusToFilter as any))
      .order("desc")
      .take(50);

    return await Promise.all(
      suggestions.map(async (suggestion) => {
        const suggester = await ctx.db.get(suggestion.suggestedBy);
        return {
          ...suggestion,
          suggesterUsername: suggester?.username || "Unknown",
          suggesterName: suggester?.name,
        };
      })
    );
  },
});

export const getMyMenuItemSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("menuItemSuggestions")
      .withIndex("by_suggester", (q) => q.eq("suggestedBy", userId))
      .order("desc")
      .take(20);
  },
});

export const approveMenuItemSuggestion = mutation({
  args: { suggestionId: v.id("menuItemSuggestions") },
  handler: async (ctx, args) => {
    const reviewer = await requireStaff(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") {
      throw new Error("Suggestion already processed");
    }

    const existing = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) =>
        q.eq("restaurantId", suggestion.restaurantId)
      )
      .filter((q) => q.eq(q.field("itemName"), suggestion.itemName))
      .first();

    if (existing) {
      await ctx.db.patch(args.suggestionId, {
        status: "approved",
        reviewedBy: reviewer._id,
        reviewedAt: Date.now(),
        note: "Approved (already exists in menu)",
      });
    } else {
      await ctx.db.insert("menuItems", {
        restaurantId: suggestion.restaurantId,
        restaurantName: suggestion.restaurantName,
        itemName: suggestion.itemName,
        category: suggestion.category,
        price: suggestion.price,
      });

      await ctx.db.patch(args.suggestionId, {
        status: "approved",
        reviewedBy: reviewer._id,
        reviewedAt: Date.now(),
      });
    }

    // Notify the suggester using ctx.runMutation
    await ctx.runMutation(api.notifications.createNotificationInternal, {
      recipientId: suggestion.suggestedBy,
      senderId: reviewer._id,
      type: "suggestion" as any,
      targetType: "suggestion" as any,
      targetId: suggestion._id,
      message: `Your suggested item "${suggestion.itemName}" was approved!`,
    });

    return { success: true };
  },
});

export const rejectMenuItemSuggestion = mutation({
  args: {
    suggestionId: v.id("menuItemSuggestions"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireStaff(ctx);

    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    if (suggestion.status !== "pending") {
      throw new Error("Suggestion already processed");
    }

    await ctx.db.patch(args.suggestionId, {
      status: "rejected",
      reviewedBy: reviewer._id,
      reviewedAt: Date.now(),
      note: args.note,
    });

    // Notify the suggester using ctx.runMutation
    await ctx.runMutation(api.notifications.createNotificationInternal, {
      recipientId: suggestion.suggestedBy,
      senderId: reviewer._id,
      type: "suggestion" as any,
      targetType: "suggestion" as any,
      targetId: suggestion._id,
      message: args.note
        ? `Your suggested item "${suggestion.itemName}" was rejected. Note: ${args.note}`
        : `Your suggested item "${suggestion.itemName}" was rejected.`,
    });

    return { success: true };
  },
});