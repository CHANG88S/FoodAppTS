import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { assertMaxLength, MAX_POST_LENGTH } from "./validation";
import { hasBlockBetween } from "./blocks";
import { containsProfanity, PROFANITY_ERROR_MESSAGE } from "./profanity";

// Shared helper: attach other-user info and last message to conversations
async function enrichConversations(
  ctx: QueryCtx,
  userId: Id<"users">,
  convs: Doc<"conversations">[],
) {
  return Promise.all(
    convs.map(async (conv) => {
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
}

// Get conversations with tab logic:
// - messages: conversations with users the current user follows
// - general: accepted requests with users the current user doesn't follow
// - requests: pending (not yet accepted) requests from users the current user doesn't follow
export const listConversations = query({
  args: {
    tab: v.union(v.literal("messages"), v.literal("general"), v.literal("requests"))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) return [];

    const [asP1, asP2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
        .take(50),
      ctx.db
        .query("conversations")
        .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
        .take(50),
    ]);

    const allConversations = [...asP1, ...asP2]
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .slice(0, 50);

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const followingIds = following.map(f => f.followingId);

    const filteredConversations = allConversations.filter(conv => {
      const otherParticipantId = conv.participant1Id === userId
        ? conv.participant2Id
        : conv.participant1Id;
      const isFollowed = followingIds.includes(otherParticipantId);
      const hasAccepted = conv.participant1Id === userId
        ? conv.participant1Accepted === true
        : conv.participant2Accepted === true;

      if (args.tab === "messages") return isFollowed;
      if (args.tab === "general") return !isFollowed && hasAccepted;
      return !isFollowed && !hasAccepted;
    });

    return enrichConversations(ctx, userId as Id<"users">, filteredConversations);
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

    // Enforce blocks: neither participant can start a conversation
    if (await hasBlockBetween(ctx, userId as string, args.otherUserId)) {
      throw new Error("You can't message this user");
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

    // Create new conversation (initiator implicitly accepts their own request)
    const conversationId = await ctx.db.insert("conversations", {
      participant1Id: userId,
      participant2Id: args.otherUserId,
      participant1Accepted: true,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

// Accept a message request
export const acceptConversationRequest = mutation({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const conversation = await ctx.db.get(args.conversationId as Id<"conversations">);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.participant1Id === userId) {
      await ctx.db.patch(conversation._id, { participant1Accepted: true });
    } else if (conversation.participant2Id === userId) {
      await ctx.db.patch(conversation._id, { participant2Accepted: true });
    } else {
      throw new Error("Not authorized to accept this conversation");
    }

    return conversation._id;
  },
});

// Whether the conversation is a pending message request for the current user
export const getConversationRequestState = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isPendingRequest: false };

    const conversation = await ctx.db.get(args.conversationId as Id<"conversations">);
    if (!conversation) return { isPendingRequest: false };

    const isParticipant =
      conversation.participant1Id === userId || conversation.participant2Id === userId;
    if (!isParticipant) return { isPendingRequest: false };

    const otherParticipantId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;

    // Requests only apply to people we don't follow
    const followEdge = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", userId).eq("followingId", otherParticipantId)
      )
      .first();
    if (followEdge) return { isPendingRequest: false };

    const hasAccepted = conversation.participant1Id === userId
      ? conversation.participant1Accepted === true
      : conversation.participant2Accepted === true;

    return { isPendingRequest: !hasAccepted };
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

    if (containsProfanity(args.content)) {
      throw new Error(PROFANITY_ERROR_MESSAGE);
    }

    assertMaxLength(args.content, MAX_POST_LENGTH, "Message");

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

    // Enforce blocks: neither participant can message the other
    const recipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;
    if (await hasBlockBetween(ctx, userId as string, recipientId)) {
      throw new Error("You can't message this user");
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      isUnsent: false,
      createdAt: Date.now(),
    });

    // Update conversation last message time (replying also accepts a pending request)
    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
      ...(conversation.participant1Id === userId
        ? { participant1Accepted: true }
        : { participant2Accepted: true }),
    });

    // Create notification for recipient (only if they follow the sender)
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

    // Enforce blocks: neither participant can message the other
    const imageRecipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;
    if (await hasBlockBetween(ctx, userId as string, imageRecipientId)) {
      throw new Error("You can't message this user");
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

    // Update conversation last message time (replying also accepts a pending request)
    await ctx.db.patch(conversation._id, {
      lastMessageAt: Date.now(),
      ...(conversation.participant1Id === userId
        ? { participant1Accepted: true }
        : { participant2Accepted: true }),
    });

    // Create notification for recipient
    const isFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follow_pair", (q) =>
        q.eq("followerId", imageRecipientId).eq("followingId", userId)
      )
      .first();

    if (isFollowing) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: imageRecipientId,
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

// React to a message with an emoji (reacting with the same emoji again removes it)
export const reactToMessage = mutation({
  args: { messageId: v.id("messages"), emoji: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.isUnsent) {
      throw new Error("Cannot react to an unsent message");
    }

    const conversation = await ctx.db.get(message.conversationId as Id<"conversations">);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new Error("Not authorized to react to messages in this conversation");
    }

    const reactions = { ...(message.reactions || {}) };
    if (reactions[userId] === args.emoji) {
      delete reactions[userId];
    } else {
      reactions[userId] = args.emoji;
    }

    await ctx.db.patch(message._id, { reactions });
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