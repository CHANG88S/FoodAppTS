import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// The one upload URL source for every screen (reviews, profile, tweets, DMs).
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.storage.generateUploadUrl();
  },
});

// GET THE PUBLIC URL
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

// GET MULTIPLE PUBLIC URLS
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