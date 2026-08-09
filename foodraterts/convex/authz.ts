import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const STAFF_ROLES = ["owner", "admin", "moderator", "developer"] as const;

/**
 * Server-side helper: ensures the current user has a staff role.
 * Throws if not authenticated or role is not in STAFF_ROLES.
 * Use this in mutations/actions to gate administrative operations.
 */
export async function requireStaff(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: must be logged in");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!STAFF_ROLES.includes(user.role as any)) {
    throw new Error("Forbidden: staff only");
  }

  return user;
}

/**
 * Query for the client: returns whether the current user is staff.
 * Use via useQuery(api.authz.isStaff) for conditional UI rendering.
 */
export const isStaff = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = await ctx.db.get(userId);
    if (!user) return false;

    return STAFF_ROLES.includes(user.role as any);
  },
});
