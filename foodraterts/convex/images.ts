import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// 1. GENERATE THE UPLOAD URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// 2. SAVE RESTAURANT PHOTO / CREATE A TWEET
export const saveRestaurantPhoto = mutation({
  args: { 
    restaurantId: v.id("restaurants"), 
    imageStorageId: v.string(), // Accept as string to avoid strict ID mismatch, then cast
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    await ctx.db.insert("tweets", {
      imageStorageId: args.imageStorageId as Id<"_storage">,
      body: "Uploaded a new photo!",
      userId: identity ? identity.subject : undefined,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
  },
});

// 3. CREATE A TWEET WITH AN IMAGE STORAGE ID
export const createTweet = mutation({
  args: { 
    body: v.string(),
    restaurantId: v.optional(v.id("restaurants")),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    await ctx.db.insert("tweets", {
      body: args.body,
      imageStorageId: args.imageStorageId as Id<"_storage"> | undefined,
      userId: identity ? identity.subject : undefined,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
  },
});

// 4. GET THE PUBLIC URL
export const getPublicUrl = query({
  args: { storageId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.storageId) return null;

    // If a full HTTP URL was somehow passed, just return it directly
    if (args.storageId.startsWith("http")) {
      return args.storageId;
    }

    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});

// 5. GET MULTIPLE PUBLIC URLS
export const getPublicUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls: Record<string, string> = {};

    for (const storageId of args.storageIds) {
      if (!storageId) continue;

      // If a full HTTP URL was somehow passed, just return it directly
      if (storageId.startsWith("http")) {
        urls[storageId] = storageId;
      } else {
        const url = await ctx.storage.getUrl(storageId as Id<"_storage">);
        if (url) {
          urls[storageId] = url;
        }
      }
    }

    return urls;
  },
});