import { query } from "./_generated/server";
import { v } from "convex/values";

// This lets you pass a storageId and returns the public link
export const getPublicUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});