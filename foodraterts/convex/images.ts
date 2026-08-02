import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    await ctx.db.insert("tweets", {
      imageStorageId: args.storageId,
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
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    await ctx.db.insert("tweets", {
      body: args.body,
      imageStorageId: args.imageStorageId,
      userId: identity ? identity.subject : undefined,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
  },
});

// 4. GET THE PUBLIC URL
export const getPublicUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});