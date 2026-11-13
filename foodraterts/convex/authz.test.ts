/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import schema from "./schema";
import { containsProfanity } from "./profanity";

// getAuthUserId resolves the session through the Convex Auth component, which
// convex-test does not mount. These tests sign in with
// t.withIdentity({ subject: userId }), so the user id is the identity subject.
vi.mock("@convex-dev/auth/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@convex-dev/auth/server")>()),
  getAuthUserId: async (ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) =>
    (await ctx.auth.getUserIdentity())?.subject ?? null,
}));

const modules = import.meta.glob("./**/*.*s");

type Role = "user" | "moderator" | "admin" | "developer" | "owner";

async function setup() {
  const t = convexTest(schema, modules);
  const makeUser = (username: string, role: Role = "user") =>
    t.run((ctx) => ctx.db.insert("users", { username, role }));
  const alice = await makeUser("alice");
  const bob = await makeUser("bob");
  const as = (userId: Id<"users">) => t.withIdentity({ subject: userId });
  return { t, alice, bob, makeUser, as };
}

describe("review comments", () => {
  test("only the author can delete a comment", async () => {
    const { t, alice, bob, as } = await setup();
    const reviewId = await t.run(async (ctx) => {
      const restaurantId = await ctx.db.insert("restaurants", {
        restaurantName: "Tea Topia",
        city: "Riverside",
        state: "CA",
        address: "1234 University Ave",
      });
      const itemId = await ctx.db.insert("menuItems", {
        restaurantId,
        restaurantName: "Tea Topia",
        itemName: "Brown Sugar Milk Tea",
      });
      return ctx.db.insert("itemReviews", {
        itemId,
        userId: alice,
        overallRating: 4,
        notes: "good",
        granularAttributes: [],
        comments: [
          { commentId: "c1", userId: alice, userName: "alice", userHandle: "@alice", text: "hi", createdAt: 1 },
        ],
      });
    });

    await expect(
      as(bob).mutation(api.items.deleteCommentFromReview, { reviewId, commentId: "c1" })
    ).rejects.toThrow("Unauthorized to delete this comment");

    await as(alice).mutation(api.items.deleteCommentFromReview, { reviewId, commentId: "c1" });
    const review = await t.run((ctx) => ctx.db.get(reviewId));
    expect(review?.comments).toEqual([]);
  });
});

describe("tweets", () => {
  test("only the author can delete a tweet", async () => {
    const { t, alice, bob, as } = await setup();
    const tweetId = await t.run((ctx) =>
      ctx.db.insert("tweets", { body: "boba", userId: alice, likes: [], comments: [], createdAt: 1 })
    );

    await expect(as(bob).mutation(api.tweets.deleteTweet, { tweetId })).rejects.toThrow(
      "not authorized"
    );
    await as(alice).mutation(api.tweets.deleteTweet, { tweetId });
    expect(await t.run((ctx) => ctx.db.get(tweetId))).toBeNull();
  });

  test("a block stops likes in both directions", async () => {
    const { t, alice, bob, as } = await setup();
    const tweetId = await t.run(async (ctx) => {
      await ctx.db.insert("userBlocks", { blockerId: alice, blockedId: bob, createdAt: 1 });
      return ctx.db.insert("tweets", { body: "boba", userId: alice, likes: [], comments: [], createdAt: 1 });
    });

    await expect(as(bob).mutation(api.tweets.toggleLikeTweet, { tweetId })).rejects.toThrow(
      "can't interact"
    );
  });
});

describe("messages", () => {
  test("a non-participant cannot send into a conversation", async () => {
    const { t, alice, bob, makeUser, as } = await setup();
    const carol = await makeUser("carol");
    const conversationId = await t.run((ctx) =>
      ctx.db.insert("conversations", {
        participant1Id: alice,
        participant2Id: bob,
        lastMessageAt: 1,
        createdAt: 1,
      })
    );

    await expect(
      as(carol).mutation(api.messaging.sendMessage, { conversationId, content: "hello" })
    ).rejects.toThrow("Not authorized");

    await as(bob).mutation(api.messaging.sendMessage, { conversationId, content: "hello" });
  });
});

describe("notifications", () => {
  test("only the recipient can mark a notification read", async () => {
    const { t, alice, bob, as } = await setup();
    const notificationId = await t.run((ctx) =>
      ctx.db.insert("notifications", {
        recipientId: alice,
        senderId: bob,
        type: "follow",
        targetType: "user",
        isRead: false,
        createdAt: 1,
      })
    );

    await expect(
      as(bob).mutation(api.notifications.markAsRead, { notificationId })
    ).rejects.toThrow("Unauthorized");
    await as(alice).mutation(api.notifications.markAsRead, { notificationId });
    expect((await t.run((ctx) => ctx.db.get(notificationId)))?.isRead).toBe(true);
  });
});

describe("staff-only menu edits", () => {
  test("a regular user is refused and a moderator is allowed", async () => {
    const { t, alice, makeUser, as } = await setup();
    const mod = await makeUser("mod", "moderator");
    const itemId = await t.run(async (ctx) => {
      const restaurantId = await ctx.db.insert("restaurants", {
        restaurantName: "Tea Topia",
        city: "Riverside",
        state: "CA",
        address: "1234 University Ave",
      });
      return ctx.db.insert("menuItems", {
        restaurantId,
        restaurantName: "Tea Topia",
        itemName: "Taro Milk Tea",
      });
    });

    await expect(
      as(alice).mutation(api.items.updateMenuItem, { itemId, itemName: "Renamed" })
    ).rejects.toThrow("staff only");
    await as(mod).mutation(api.items.updateMenuItem, { itemId, itemName: "Renamed" });
    expect((await t.run((ctx) => ctx.db.get(itemId)))?.itemName).toBe("Renamed");
  });
});

describe("profanity filter", () => {
  test("catches stretched spellings without flagging food words", () => {
    expect(containsProfanity("fuuuck this")).toBe(true);
    expect(containsProfanity("b00bs")).toBe(true);
    expect(containsProfanity("shiitake ramen and grape slush")).toBe(false);
    expect(containsProfanity("class of Essex")).toBe(false);
  });
});
