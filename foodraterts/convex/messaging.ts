import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Get conversations with tab logic
export const listConversations = query({
  args: {
    tab: v.union(v.literal("messages"), v.literal("general"), v.literal("requests"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return [];

    switch (args.tab) {
      case "messages": {
        // Get conversations with users that current user follows
        const following = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", userId))
          .collect();

        const followingIds = following.map(f => f.followingId);

        // Get conversations where user is a participant and they follow the other person
        const allConversations = await ctx.db
          .query("conversations")
          .filter((q) =>
            q.or(
              q.eq(q.field("participant1Id"), userId),
              q.eq(q.field("participant2Id"), userId)
            )
          )
          .order("desc")
          .take(50);

        const filteredConversations = allConversations.filter(conv => {
          const otherParticipantId = conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id;
          return followingIds.includes(otherParticipantId);
        });

        // Enrich with other user info and last message
        const enrichedConversations = await Promise.all(
          filteredConversations.map(async (conv) => {
            const otherParticipantId = conv.participant1Id === userId
              ? conv.participant2Id
              : conv.participant1Id;
            const otherUser = await ctx.db.get(otherParticipantId as Id<"users">);

            // Get last message
            const lastMessage = await ctx.db
              .query("messages")
              .withIndex("by_conversation_and_created", (q) => q.eq("conversationId", conv._id))
              .order("desc")
              .first();

            return {
              ...conv,
              otherUser,
              lastMessage,
            };
          })
        );

        return enrichedConversations;
      }

      case "general": {
        // All conversations except those with followed users (to avoid duplication)
        const following = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", userId))
          .collect();

        const followingIds = following.map(f => f.followingId);

        const allConversations = await ctx.db
          .query("conversations")
          .filter((q) =>
            q.or(
              q.eq(q.field("participant1Id"), userId),
              q.eq(q.field("participant2Id"), userId)
            )
          )
          .order("desc")
          .take(50);

        // Filter out conversations with followed users (they're in Messages tab)
        const filteredConversations = allConversations.filter(conv => {
          const otherParticipantId = conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id;
          return !followingIds.includes(otherParticipantId);
        });

        const enrichedConversations = await Promise.all(
          filteredConversations.map(async (conv) => {
            const otherParticipantId = conv.participant1Id === userId
              ? conv.participant2Id
              : conv.participant1Id;
            const otherUser = await ctx.db.get(otherParticipantId as Id<"users">);

            const lastMessage = await ctx.db
              .query("messages")
              .withIndex("by_conversation_and_created", (q) => q.eq("conversationId", conv._id))
              .order("desc")
              .first();

            return {
              ...conv,
              otherUser,
              lastMessage,
            };
          })
        );

        return enrichedConversations;
      }

      case "requests": {
        // Conversations with users that current user doesn't follow
        const following = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", userId))
          .collect();

        const followingIds = following.map(f => f.followingId);

        const allConversations = await ctx.db
          .query("conversations")
          .filter((q) =>
            q.or(
              q.eq(q.field("participant1Id"), userId),
              q.eq(q.field("participant2Id"), userId)
            )
          )
          .order("desc")
          .take(50);

        const filteredConversations = allConversations.filter(conv => {
          const otherParticipantId = conv.participant1Id === userId
            ? conv.participant2Id
            : conv.participant1Id;
          return !followingIds.includes(otherParticipantId);
        });

        const enrichedConversations = await Promise.all(
          filteredConversations.map(async (conv) => {
            const otherParticipantId = conv.participant1Id === userId
              ? conv.participant2Id
              : conv.participant1Id;
            const otherUser = await ctx.db.get(otherParticipantId as Id<"users">);

            const lastMessage = await ctx.db
              .query("messages")
              .withIndex("by_conversation_and_created", (q) => q.eq("conversationId", conv._id))
              .order("desc")
              .first();

            return {
              ...conv,
              otherUser,
              lastMessage,
            };
          })
        );

        return enrichedConversations;
      }

      default:
        return [];
    }
  },
});

// Get messages for a specific conversation
export const getMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Enrich with sender information
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.isUnsent) return message;

        const sender = await ctx.db.get(message.senderId as Id<"users">);
        return {
          ...message,
          sender,
        };
      })
    );

    return enrichedMessages;
  },
});

// Get unread message count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const followingIds = following.map(f => f.followingId);

    const conversations = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.eq(q.field("participant1Id"), userId),
          q.eq(q.field("participant2Id"), userId)
        )
      )
      .collect();

    let unreadCount = 0;

    for (const conv of conversations) {
      const otherParticipantId = conv.participant1Id === userId
        ? conv.participant2Id
        : conv.participant1Id;

      // Only count unread from users we follow
      if (!followingIds.includes(otherParticipantId)) continue;

      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation_and_created", (q) => q.eq("conversationId", conv._id))
        .order("desc")
        .first();

      if (lastMessage && lastMessage.senderId !== userId && !lastMessage.isUnsent) {
        // Check if message was sent after we last checked
        const user = await ctx.db.get(userId as Id<"users">);
        const lastCheckedAt = user?.lastCheckedMessagesAt || 0;

        if (lastMessage.createdAt > lastCheckedAt) {
          unreadCount++;
        }
      }
    }

    return unreadCount;
  },
});

// Start a new conversation
export const startConversation = mutation({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    if (userId === args.otherUserId) {
      throw new Error("Cannot start conversation with yourself");
    }

    // Check if conversation already exists
    const existingConv = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.or(
            q.and(
              q.eq(q.field("participant1Id"), userId),
              q.eq(q.field("participant2Id"), args.otherUserId)
            ),
            q.and(
              q.eq(q.field("participant1Id"), args.otherUserId),
              q.eq(q.field("participant2Id"), userId)
            )
          )
        )
      )
      .first();

    if (existingConv) {
      return existingConv._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participant1Id: userId,
      participant2Id: args.otherUserId,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

// Send a text message
export const sendMessage = mutation({
  args: {
    conversationId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    if (!args.content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId as any))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is part of conversation
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      isUnsent: false,
      createdAt: Date.now(),
    });

    // Update conversation last message time
    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
    });

    // Create notification for recipient (only if they follow the sender)
    const recipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;

    const isFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", recipientId).eq("followingId", userId)
      )
      .first();

    if (isFollowing) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId,
        senderId: userId,
        type: "mention", // Using mention for DM notifications
        targetType: "user",
        targetId: args.conversationId,
        message: `Sent you a message: ${args.content.substring(0, 50)}${args.content.length > 50 ? '...' : ''}`,
      });
    }

    return messageId;
  },
});

// Send a message with image/GIF
export const sendImageMessage = mutation({
  args: {
    conversationId: v.string(),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId as any))
      .first();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Verify user is part of conversation
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    // Create message with image
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: "[Image]",
      imageStorageId: args.imageStorageId,
      isUnsent: false,
      createdAt: Date.now(),
    });

    // Update conversation last message time
    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
    });

    // Create notification for recipient
    const recipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;

    const isFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", recipientId).eq("followingId", userId)
      )
      .first();

    if (isFollowing) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId,
        senderId: userId,
        type: "mention",
        targetType: "user",
        targetId: args.conversationId,
        message: "Sent you an image",
      });
    }

    return messageId;
  },
});

// Unsend a message
export const unsendMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== userId) {
      throw new Error("Not authorized to unsend this message");
    }

    await ctx.db.patch(args.messageId, {
      isUnsent: true,
    });
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Update user's last checked time
    await ctx.db.patch(userId as Id<"users">, {
      lastCheckedMessagesAt: Date.now(),
    });
  },
});

// Generate upload URL for message images
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    return await ctx.storage.generateUploadUrl();
  },
});

// Search users by username or name
export const searchUsers = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const searchTerm = args.searchQuery.toLowerCase().trim();

    if (searchTerm.length < 2) return [];

    // Search all users except current user
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), userId))
      .collect();

    // Filter by username or name containing search term
    const matchingUsers = allUsers.filter(user => {
      const username = user.username?.toLowerCase() || "";
      const name = user.name?.toLowerCase() || "";

      return username.includes(searchTerm) || name.includes(searchTerm);
    });

    // Return limited results
    return matchingUsers.slice(0, 20).map(user => ({
      _id: user._id,
      username: user.username,
      name: user.name,
      profilePicture: user.profilePicture,
    }));
  },
});