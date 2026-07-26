import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserRole = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;
    // 🔑 Return username alongside userId, role, and optional name
    return { 
      userId: user._id, 
      role: user.role, 
      username: user.username, 
      name: user.name ?? null 
    };
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Optional: Return explicit fields or the full user document 
    // since user.username is now a required field and user.name is optional.
    return user; 
  },
});