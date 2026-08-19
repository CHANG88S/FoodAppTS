import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireStaff } from "./authz";

export const searchMenuItems = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchQuery === "") return [];
    return await ctx.db
      .query("menuItems")
      .withSearchIndex("search_item", (q) => q.search("itemName", args.searchQuery))
      .take(15);
  },
});

export const getReviewById = query({
  args: {
    reviewId: v.string(),
  },
  handler: async (ctx, args) => {
    const actualId = args.reviewId.split("-")[0] as any;
    return await ctx.db.get(actualId);
  },
});

export const getReviewActivityById = query({
  args: {
    reviewId: v.string(),
  },
  handler: async (ctx, args) => {
    // Parse composite key: `${reviewId}-created|updated`
    const parts = args.reviewId.split("-");
    const actualId = parts[0] as any;
    const suffix = parts[parts.length - 1]; // Get last part

    const review = (await ctx.db.get(actualId as any)) as any;
    if (!review) return null;

    // Hydrate item and restaurant
    const item = (await ctx.db.get(review.itemId as any)) as any;
    if (!item) return null;

    const restaurant = (await ctx.db.get(item.restaurantId as any)) as any;
    if (!restaurant) return null;

    // Determine activity type
    const activityType = suffix === "updated" && review.updatedAt && review.updatedAt > review.createdAt + 1000
      ? "updated"
      : "rated";

    // Get author info
    const author = (await ctx.db.get(review.userId as any)) as any;
    const authorName = author?.name || author?.username || "User";
    const authorHandle = author?.username ? `@${author.username}` : "@user";

    // Determine which image to show based on activity type
    let imageStorageId = review.imageStorageId;
    if (activityType === "updated") {
      imageStorageId = review.updatedImageStorageId || review.originalImageStorageId || review.imageStorageId;
    }

    // Return the same activity shape as getUserReviews entries
    return {
      ...review,
      _id: actualId,
      uniqueKey: args.reviewId,
      activityType,
      itemName: item.itemName,
      restaurantName: restaurant.restaurantName,
      imageStorageId,
      authorName,
      authorHandle,
    };
  },
});

export const addMenuItem = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    restaurantName: v.string(),
    itemName: v.string(),
    category: v.optional(v.union(v.string(), v.array(v.string()))),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Staff-only: regular users should use suggestMenuItem instead
    await requireStaff(ctx);

    const existingItem = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .filter((q) => q.eq(q.field("itemName"), args.itemName))
      .first();

    if (existingItem) {
      return existingItem._id;
    }

    return await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      itemName: args.itemName,
      category: args.category,
      price: args.price,
    });
  },
});

export const createItemReview = mutation({
  args: {
    itemId: v.id("menuItems"),
    overallRating: v.number(),
    notes: v.string(),
    criteriaList: v.array(
      v.object({
        id: v.optional(v.string()),
        name: v.string(),
        value: v.union(v.number(), v.string()),
      })
    ),
    orderNotes: v.optional(v.string()),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    editReviewId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in to submit a review.");

    const now = Date.now();
    const cleanImageId = args.imageStorageId ?? undefined;

    if (args.editReviewId) {
      const cleanId = args.editReviewId.split("-")[0] as any;
      const reviewToUpdate: any = await ctx.db.get(cleanId);
      if (reviewToUpdate && reviewToUpdate.userId === userId) {
        let updateData: any = {
          overallRating: args.overallRating,
          notes: args.notes,
          granularAttributes: args.criteriaList,
          orderNotes: args.orderNotes,
          updatedAt: now,
        };

        if (args.imageStorageId !== undefined) {
          if (args.imageStorageId === null) {
            updateData.imageStorageId = undefined;
            updateData.updatedImageStorageId = undefined;
          } else {
            if (!reviewToUpdate.originalImageStorageId && reviewToUpdate.imageStorageId) {
              updateData.originalImageStorageId = reviewToUpdate.imageStorageId;
            }
            updateData.imageStorageId = cleanImageId;
            updateData.updatedImageStorageId = cleanImageId;
          }
        }

        await ctx.db.patch(cleanId, updateData);
        return cleanId;
      }
    }

    const existingReview = await ctx.db
      .query("itemReviews")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingReview) {
      let updateData: any = {
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        updatedAt: now,
      };

      if (args.imageStorageId !== undefined) {
        if (args.imageStorageId === null) {
          updateData.imageStorageId = undefined;
          updateData.updatedImageStorageId = undefined;
        } else {
          if (!existingReview.originalImageStorageId && existingReview.imageStorageId) {
            updateData.originalImageStorageId = existingReview.imageStorageId;
          }
          updateData.imageStorageId = cleanImageId;
          updateData.updatedImageStorageId = cleanImageId;
        }
      }

      await ctx.db.patch(existingReview._id, updateData);
      return existingReview._id;
    } else {
      const newReviewId = await ctx.db.insert("itemReviews", {
        itemId: args.itemId,
        userId: userId,
        overallRating: args.overallRating,
        notes: args.notes,
        granularAttributes: args.criteriaList,
        orderNotes: args.orderNotes,
        imageStorageId: cleanImageId,
        originalImageStorageId: cleanImageId,
        updatedImageStorageId: undefined,
        likes: [],
        comments: [],
        updateLikes: [],
        updateComments: [],
        createdAt: now,
        updatedAt: now,
      });
      return newReviewId;
    }
  },
});

export const deleteItemReview = mutation({
  args: { reviewId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    
    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized.");
    }

    await ctx.db.delete(actualId);
    return true;
  },
});

export const removeReviewImage = mutation({
  args: {
    reviewId: v.string(),
    activityType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);

    if (!review || review.userId !== userId) {
      throw new Error("Review not found or unauthorized.");
    }

    if (args.activityType === "updated") {
      await ctx.db.patch(actualId, {
        imageStorageId: review.originalImageStorageId || undefined,
        updatedImageStorageId: undefined,
      });
    } else {
      await ctx.db.patch(actualId, {
        imageStorageId: undefined,
        originalImageStorageId: undefined,
        updatedImageStorageId: undefined,
      });
    }

    return true;
  },
});

export const toggleLikeReview = mutation({
  args: { 
    reviewId: v.string(),
    activityType: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const likes = isUpdate ? (review.updateLikes || []) : (review.likes || []);
    const hasLiked = likes.includes(userId);

    const updatedLikes = hasLiked
      ? likes.filter((id: string) => id !== userId)
      : [...likes, userId];

    if (isUpdate) {
      await ctx.db.patch(actualId, { updateLikes: updatedLikes });
    } else {
      await ctx.db.patch(actualId, { likes: updatedLikes });
    }

    // Create notification for new like (if liking someone else's review)
    if (!hasLiked && review.userId !== userId) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId: review.userId,
        senderId: userId,
        type: "like",
        targetType: "review",
        targetId: args.reviewId,
        message: undefined,
      });
    }

    return !hasLiked;
  },
});

export const addCommentToReview = mutation({
  args: {
    reviewId: v.string(),
    text: v.string(),
    activityType: v.optional(v.string()),
    replyToCommentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user: any = await ctx.db.get(userId as any);
    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const comments = isUpdate ? (review.updateComments || []) : (review.comments || []);

    // Handle reply threading - flatten to top-level parent
    let rootId = args.replyToCommentId;
    let parentComment = null;
    if (args.replyToCommentId) {
      parentComment = comments.find((c: any) => c.commentId === args.replyToCommentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
      // Flatten reply-to-reply to top-level parent
      rootId = parentComment.replyToCommentId || args.replyToCommentId;
    }

    const newComment = {
      commentId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      userName: user?.name || user?.username || "User",
      userHandle: user?.username ? `@${user.username}` : "@user",
      text: args.text,
      createdAt: Date.now(),
      replyToCommentId: rootId,
      replyToUserId: parentComment?.userId,
      replyToUserName: parentComment?.userName || parentComment?.userHandle || "User",
    };

    if (isUpdate) {
      await ctx.db.patch(actualId, {
        updateComments: [...comments, newComment],
      });
    } else {
      await ctx.db.patch(actualId, {
        comments: [...comments, newComment],
      });
    }

    // Create notifications for review owner and parent comment author
    const { internal } = await import("./_generated/api");
    const recipients = new Set<string>();

    // Always notify review owner (if different from commenter)
    if (review.userId !== userId) {
      recipients.add(review.userId);
    }

    // Notify parent comment author (if different from commenter and review owner)
    if (parentComment && parentComment.userId !== userId && parentComment.userId !== review.userId) {
      recipients.add(parentComment.userId);
    }

    for (const recipientId of recipients) {
      await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
        recipientId,
        senderId: userId,
        type: "comment",
        targetType: "review",
        targetId: args.reviewId,
        message: parentComment
          ? `replied to your comment: "${args.text.slice(0, 80)}${args.text.length > 80 ? '...' : ''}"`
          : args.text,
      });
    }

    return newComment;
  },
});

export const deleteCommentFromReview = mutation({
  args: {
    reviewId: v.string(),
    commentId: v.string(),
    activityType: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const actualId = args.reviewId.split("-")[0] as any;
    const review: any = await ctx.db.get(actualId);
    if (!review) throw new Error("Review not found");

    const isUpdate = args.activityType === "updated";
    const comments = isUpdate ? (review.updateComments || []) : (review.comments || []);
    const targetComment = comments.find((c: any) => c.commentId === args.commentId);

    if (!targetComment || targetComment.userId !== userId) {
      throw new Error("Unauthorized to delete this comment");
    }

    // Cascade delete: remove the comment and all replies to it
    const updatedComments = comments.filter((c: any) =>
      c.commentId !== args.commentId && c.replyToCommentId !== args.commentId
    );

    if (isUpdate) {
      await ctx.db.patch(actualId, { updateComments: updatedComments });
    } else {
      await ctx.db.patch(actualId, { comments: updatedComments });
    }
    return true;
  },
});

export const getUserReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reviews = await ctx.db
      .query("itemReviews")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const activities: any[] = [];

    await Promise.all(
      reviews.map(async (review: any) => {
        const item: any = await ctx.db.get(review.itemId);
        const restaurant: any = item?.restaurantId ? await ctx.db.get(item.restaurantId) : null;

        let actualVisits = 0;
        if (restaurant && restaurant._id) {
          const visits = await ctx.db
            .query("restaurantVisits")
            .withIndex("by_user_and_restaurant", (q) => 
              q.eq("userId", userId).eq("restaurantId", restaurant._id)
            )
            .collect();
          actualVisits = visits.length;
        }

        const visitCount = Math.max(1, actualVisits);

        const createdAt = review.createdAt || review._creationTime || 0;
        const updatedAt = review.updatedAt || createdAt;
        const hasBeenUpdated = updatedAt > createdAt + 1000;

        const baseData = {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "",
          lat: restaurant?.lat,
          lng: restaurant?.lng,
          visitCount,
        };

        const originalImage = review.originalImageStorageId || (hasBeenUpdated ? undefined : review.imageStorageId);

        activities.push({
          ...baseData,
          _id: review._id,
          uniqueKey: `${review._id}-created`,
          activityType: "rated",
          timestamp: createdAt,
          imageStorageId: originalImage,
          likes: review.likes || [],
          comments: review.comments || [],
        });

        if (hasBeenUpdated) {
          activities.push({
            ...baseData,
            _id: review._id,
            uniqueKey: `${review._id}-updated`,
            activityType: "updated",
            timestamp: updatedAt,
            imageStorageId: review.updatedImageStorageId || review.imageStorageId || undefined,
            likes: review.updateLikes || [],
            comments: review.updateComments || [],
          });
        }
      })
    );

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  },
});

export const getUserReviewsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;

    const reviews = await ctx.db
      .query("itemReviews")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const activities: any[] = [];

    await Promise.all(
      reviews.map(async (review: any) => {
        const item: any = await ctx.db.get(review.itemId);
        const restaurant: any = item?.restaurantId ? await ctx.db.get(item.restaurantId) : null;

        let actualVisits = 0;
        if (restaurant && restaurant._id) {
          const visits = await ctx.db
            .query("restaurantVisits")
            .withIndex("by_user_and_restaurant", (q) =>
              q.eq("userId", userId).eq("restaurantId", restaurant._id)
            )
            .collect();
          actualVisits = visits.length;
        }

        const visitCount = Math.max(1, actualVisits);

        const createdAt = review.createdAt || review._creationTime || 0;
        const updatedAt = review.updatedAt || createdAt;
        const hasBeenUpdated = updatedAt > createdAt + 1000;

        const baseData = {
          ...review,
          itemName: item?.itemName || "Menu Item",
          restaurantName: restaurant?.restaurantName || item?.restaurantName || "",
          address: restaurant?.address || "",
          city: restaurant?.city || "",
          state: restaurant?.state || "",
          lat: restaurant?.lat,
          lng: restaurant?.lng,
          visitCount,
        };

        const originalImage = review.originalImageStorageId || (hasBeenUpdated ? undefined : review.imageStorageId);

        activities.push({
          ...baseData,
          _id: review._id,
          uniqueKey: `${review._id}-created`,
          activityType: "rated",
          timestamp: createdAt,
          imageStorageId: originalImage,
          likes: review.likes || [],
          comments: review.comments || [],
        });

        if (hasBeenUpdated) {
          activities.push({
            ...baseData,
            _id: review._id,
            uniqueKey: `${review._id}-updated`,
            activityType: "updated",
            timestamp: updatedAt,
            imageStorageId: review.updatedImageStorageId || review.imageStorageId || undefined,
            likes: review.updateLikes || [],
            comments: review.updateComments || [],
          });
        }
      })
    );

    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  },
});

export const userHasReviewedRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const itemIds = menuItems.map((item) => item._id);
    if (itemIds.length === 0) return false;

    for (const itemId of itemIds) {
      const review = await ctx.db
        .query("itemReviews")
        .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      
      if (review) return true;
    }

    return false;
  },
});

export const getReviewsWithPhotosForRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const menuItems = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();

    const itemIds = menuItems.map((item) => item._id);
    if (itemIds.length === 0) return [];

    const reviews: any[] = [];
    for (const itemId of itemIds) {
      const itemReviews = await ctx.db
        .query("itemReviews")
        .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
        .collect();

      for (const review of itemReviews) {
        if (review.imageStorageId) {
          const item = await ctx.db.get(itemId);
          reviews.push({
            ...review,
            itemName: item?.itemName || "Menu Item",
          });
        }
      }
    }

    return reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
});