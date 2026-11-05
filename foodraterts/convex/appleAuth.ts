// Internal helpers backing the Sign in with Apple provider configured in
// auth.ts. These are called from the provider's authorize callback via
// ctx.runQuery / ctx.runMutation (authorize runs in an action context, so
// it has no direct db access).
import { internalQuery, internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const getByAppleId = internalQuery({
  args: { appleId: v.string() },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_appleId", (q) => q.eq("appleId", args.appleId))
      .first();
  },
});

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Link an Apple ID onto an existing password-created account with the same
// verified email, so signing in with Apple reaches the same profile.
export const linkAppleId = internalMutation({
  args: { userId: v.id("users"), appleId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { appleId: args.appleId });
  },
});

// Create a fresh profile for an Apple-only user. Apple never provides a
// username, so one is generated from their name/email plus a random suffix;
// the suffix makes collisions with existing handles practically impossible
// but we still verify uniqueness (no username index, so this is a bounded
// filter scan over a small table).
export const createAppleUser = internalMutation({
  args: {
    appleId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const username = await generateUsername(ctx, args.email, args.name);
    return await ctx.db.insert("users", {
      username,
      email: args.email,
      ...(args.name ? { name: args.name } : {}),
      appleId: args.appleId,
      role: "user",
      preferences: {
        sweetness: 0.5,
        iceLevel: 0.5,
        milkBase: "Oat Milk",
        favoriteCuisines: [],
        dietaryRestrictions: [],
      },
    });
  },
});

async function generateUsername(
  ctx: MutationCtx,
  email: string,
  name?: string
): Promise<string> {
  const source = name || email.split("@")[0] || "user";
  const base = source.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "user";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}${Math.random().toString(36).slice(2, 6)}`;
    const taken = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), candidate))
      .first();
    if (!taken) return candidate;
  }
  return `${base}${Date.now().toString(36)}`;
}
