import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const listNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", userId)
      )
      .order("desc")
      .take(50);

    // Enrich with sender information with proper typing cast
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await ctx.db.get(notification.senderId as Id<"users">);
        return {
          ...notification,
          sender,
        };
      })
    );

    return enrichedNotifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.recipientId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", userId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    );
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.recipientId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.notificationId);
  },
});

// Internal function to create notifications (called by other mutations)
export const createNotificationInternal = mutation({
  args: {
    recipientId: v.string(),
    senderId: v.string(),
    type: v.union(v.literal("follow"), v.literal("like"), v.literal("comment"), v.literal("mention")),
    targetType: v.union(v.literal("tweet"), v.literal("review"), v.literal("user")),
    targetId: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Don't create notification if sender is recipient
    if (args.recipientId === args.senderId) return;

    await ctx.db.insert("notifications", {
      recipientId: args.recipientId,
      senderId: args.senderId,
      type: args.type,
      targetType: args.targetType,
      targetId: args.targetId,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});