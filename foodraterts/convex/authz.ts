import { query, QueryCtx, action, ActionCtx, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const STAFF_ROLES = ["owner", "admin", "moderator", "developer"] as const;
const ADMIN_ROLES = ["owner", "developer"] as const;

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

  const user = (await ctx.db.get(userId as any)) as any;
  if (!user) {
    throw new Error("User not found");
  }

  if (!STAFF_ROLES.includes(user.role)) {
    throw new Error("Forbidden: staff only");
  }

  return user;
}

/**
 * Server-side helper: ensures the current user has an admin role (owner or developer).
 * Throws if not authenticated or role is not in ADMIN_ROLES.
 * Use this in mutations/actions for sensitive administrative operations.
 */
export async function requireAdmin(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: must be logged in");
  }

  const user = (await ctx.db.get(userId as any)) as any;
  if (!user) {
    throw new Error("User not found");
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    throw new Error("Forbidden: admin/developer only");
  }

  return user;
}

/**
 * Internal query to get the current user with role information
 * Used by actions to check admin permissions
 */
export const getCurrentUserRole = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId as any);
  },
});

/**
 * Action-specific helper: ensures the current user has an admin role (owner or developer).
 * Throws if not authenticated or role is not in ADMIN_ROLES.
 * Use this in actions for sensitive administrative operations.
 */
export async function requireAdminAction(ctx: ActionCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: must be logged in");
  }

  // Use internal query to get user with role information
  const user = (await ctx.runQuery(internal.authz.getCurrentUserRole, {})) as any;

  if (!user) {
    throw new Error("User not found");
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    throw new Error("Forbidden: admin/developer only");
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

    const user = (await ctx.db.get(userId as any)) as any;
    if (!user) return false;

    return STAFF_ROLES.includes(user.role);
  },
});

/**
 * Query for the client: returns whether the current user is admin (owner or developer).
 * Use via useQuery(api.authz.isAdmin) for high-level admin UI rendering.
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const user = (await ctx.db.get(userId as any)) as any;
    if (!user) return false;

    return ADMIN_ROLES.includes(user.role);
  },
});