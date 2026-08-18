import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireStaff } from "./authz";
import { internal } from "./_generated/api";

// Content flagging and moderation system

export const flagContent = mutation({
    args: {
        contentType: v.union(v.literal("review"), v.literal("tweet"), v.literal("comment"), v.literal("user")),
        contentId: v.string(),
        reason: v.union(
            v.literal("spam"),
            v.literal("inappropriate"),
            v.literal("harassment"),
            v.literal("misinformation"),
            v.literal("fake_review"),
            v.literal("other")
        ),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Must be logged in to flag content");

        // Check for duplicate flags
        const existingFlag = await ctx.db
            .query("contentFlags")
            .withIndex("by_reportedBy", (q) => q.eq("reportedBy", userId as string))
            .filter((q) =>
                q.eq(q.field("status"), "pending")
                 .eq(q.field("contentType"), args.contentType)
                 .eq(q.field("contentId"), args.contentId)
            )
            .first();

        if (existingFlag) {
            return { success: true, flagId: existingFlag._id, duplicate: true };
        }

        const now = Date.now();

        // Create flag record
        const flagId = await ctx.db.insert("contentFlags", {
            contentType: args.contentType,
            contentId: args.contentId,
            reason: args.reason,
            description: args.description,
            reportedBy: userId as string,
            status: "pending",
            createdAt: now,
            reviewedAt: undefined,
            reviewedBy: undefined,
            notes: undefined,
        });

        console.log("🚩 Content Flagged:", {
            flagId,
            contentType: args.contentType,
            contentId: args.contentId,
            reason: args.reason,
            reportedBy: userId,
        });

        return { success: true, flagId, duplicate: false };
    },
});

export const getPendingFlags = query({
    args: {},
    handler: async (ctx) => {
        // Use requireStaff to check permissions and get user
        const user = await requireStaff(ctx);

        const pendingFlags = await ctx.db
            .query("contentFlags")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .take(100);

        // Hydrate each flag with content preview and reporter username
        const hydratedFlags = await Promise.all(
            (await pendingFlags.collect()).map(async (flag) => {
                let preview = null;
                let reporterUsername = "Unknown";

                // Get reporter info
                const reporter = await ctx.db.get(flag.reportedBy as any);
                if (reporter) {
                    reporterUsername = reporter.username || reporter.name || "Unknown";
                }

                // Hydrate content based on type
                if (flag.contentType === "tweet") {
                    const tweet = await ctx.db.get(flag.contentId as any);
                    if (tweet) {
                        const author = tweet.userId ? await ctx.db.get(tweet.userId as any) : null;
                        preview = {
                            kind: "tweet" as const,
                            body: tweet.body,
                            authorUsername: author?.username || "Unknown",
                        };
                    }
                } else if (flag.contentType === "review") {
                    const review = await ctx.db.get(flag.contentId as any);
                    if (review) {
                        const item = await ctx.db.get(review.itemId);
                        const restaurant = item ? await ctx.db.get(item.restaurantId) : null;
                        const author = await ctx.db.get(review.userId as any);
                        preview = {
                            kind: "review" as const,
                            notes: review.notes,
                            itemName: item?.itemName || "Unknown item",
                            restaurantName: restaurant?.restaurantName || "Unknown restaurant",
                            overallRating: review.overallRating,
                            authorUsername: author?.username || "Unknown",
                        };
                    }
                } else if (flag.contentType === "comment") {
                    // Parse contentId: tweetId:commentId or reviewId:activityType:commentId
                    const parts = flag.contentId.split(":");
                    if (parts.length === 2) {
                        // Tweet comment
                        const tweetId = parts[0];
                        const commentId = parts[1];
                        const tweet = await ctx.db.get(tweetId as any);
                        if (tweet) {
                            const comment = (tweet.comments || []).find((c: any) =>
                                c._id === commentId || c.commentId === commentId
                            );
                            if (comment) {
                                const author = comment.userId ? await ctx.db.get(comment.userId as any) : null;
                                preview = {
                                    kind: "comment" as const,
                                    text: comment.body || comment.text,
                                    authorUsername: author?.username || "Unknown",
                                    parentSummary: `Tweet by ${tweet.userId ? "user" : "unknown"}`,
                                };
                            }
                        }
                    } else if (parts.length === 3) {
                        // Review comment
                        const reviewId = parts[0];
                        const activityType = parts[1];
                        const commentId = parts[2];
                        const review = await ctx.db.get(reviewId as any);
                        if (review) {
                            const comments = activityType === "updated"
                                ? (review.updateComments || [])
                                : (review.comments || []);
                            const comment = comments.find((c: any) => c.commentId === commentId);
                            if (comment) {
                                const item = await ctx.db.get(review.itemId);
                                preview = {
                                    kind: "comment" as const,
                                    text: comment.text,
                                    authorUsername: comment.userHandle || "Unknown",
                                    parentSummary: `Review for ${item?.itemName || "unknown item"}`,
                                };
                            }
                        }
                    }
                }

                return {
                    ...flag,
                    preview,
                    reporterUsername,
                };
            })
        );

        return hydratedFlags;
    },
});

export const reviewFlag = mutation({
    args: {
        flagId: v.id("contentFlags"),
        action: v.union(v.literal("remove_content"), v.literal("dismiss"), v.literal("resolve")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Use requireStaff to check permissions and get moderator info
        const moderator = await requireStaff(ctx);

        const flag = await ctx.db.get(args.flagId);
        if (!flag) throw new Error("Flag not found");

        const now = Date.now();

        // Determine status based on action
        const status = args.action === "remove_content" ? "resolved" :
                       args.action === "dismiss" ? "dismissed" : "resolved";

        // Update flag status
        await ctx.db.patch(args.flagId, {
            status,
            reviewedBy: moderator._id as string,
            reviewedAt: now,
            notes: args.notes,
        });

        // Take action based on decision
        if (args.action === "remove_content") {
            let ownerId = null;
            let parentContentType = null;
            let parentContentId = null;

            if (flag.contentType === "tweet") {
                const tweet = await ctx.db.get(flag.contentId as any);
                if (tweet) {
                    ownerId = tweet.userId;
                    await ctx.db.delete(flag.contentId as any);
                    parentContentType = "tweet";
                    parentContentId = flag.contentId;
                }
            } else if (flag.contentType === "review") {
                const review = await ctx.db.get(flag.contentId as any);
                if (review) {
                    ownerId = review.userId;
                    await ctx.db.delete(flag.contentId as any);
                    parentContentType = "review";
                    parentContentId = flag.contentId;
                }
            } else if (flag.contentType === "comment") {
                // Parse contentId: tweetId:commentId or reviewId:activityType:commentId
                const parts = flag.contentId.split(":");
                if (parts.length === 2) {
                    // Tweet comment
                    const tweetId = parts[0];
                    const commentId = parts[1];
                    const tweet = await ctx.db.get(tweetId as any);
                    if (tweet) {
                        const currentComments = tweet.comments || [];
                        const targetComment = currentComments.find((c: any) =>
                            c._id === commentId || c.commentId === commentId
                        );
                        if (targetComment) {
                            ownerId = targetComment.userId;
                        }
                        // Cascade delete: remove comment and all replies
                        const filtered = currentComments.filter((c: any) =>
                            c._id !== commentId && c.commentId !== commentId && c.replyToCommentId !== commentId
                        );
                        await ctx.db.patch(tweetId as any, { comments: filtered });
                        parentContentType = "tweet";
                        parentContentId = tweetId;
                    }
                } else if (parts.length === 3) {
                    // Review comment
                    const reviewId = parts[0];
                    const activityType = parts[1];
                    const commentId = parts[2];
                    const review = await ctx.db.get(reviewId as any);
                    if (review) {
                        const isUpdate = activityType === "updated";
                        const comments = isUpdate ? (review.updateComments || []) : (review.comments || []);
                        const targetComment = comments.find((c: any) => c.commentId === commentId);
                        if (targetComment) {
                            ownerId = targetComment.userId;
                        }
                        // Cascade delete
                        const filtered = comments.filter((c: any) =>
                            c.commentId !== commentId && c.replyToCommentId !== commentId
                        );
                        if (isUpdate) {
                            await ctx.db.patch(reviewId as any, { updateComments: filtered });
                        } else {
                            await ctx.db.patch(reviewId as any, { comments: filtered });
                        }
                        parentContentType = "review";
                        parentContentId = reviewId;
                    }
                }
            }

            // Send notification to content owner (if different from moderator)
            if (ownerId && ownerId !== moderator._id && parentContentType && parentContentId) {
                const kindLabel = flag.contentType === "comment" ? "comment" : parentContentType;
                await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
                    recipientId: ownerId,
                    senderId: moderator._id,
                    type: "moderation",
                    targetType: parentContentType as any,
                    targetId: parentContentId,
                    message: `Your ${kindLabel} was flagged as inappropriate and removed by a moderator.`,
                });
            }
        }

        console.log("🛡️ Flag Reviewed:", {
            flagId: args.flagId,
            action: args.action,
            reviewedBy: moderator._id,
        });

        return { success: true };
    },
});

export const blockUser = mutation({
    args: {
        blockedUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Authentication required");

        const now = Date.now();

        // Check if already blocked
        const existingBlock = await ctx.db
            .query("userBlocks")
            .withIndex("by_blocker_and_blocked", (q) =>
                q.eq("blockerId", userId as string).eq("blockedId", args.blockedUserId)
            )
            .first();

        if (existingBlock) {
            // Unblock
            await ctx.db.delete(existingBlock._id);
            return { action: "unblocked", blockedUserId: args.blockedUserId };
        } else {
            // Block
            await ctx.db.insert("userBlocks", {
                blockerId: userId as string,
                blockedId: args.blockedUserId,
                createdAt: now,
            });
            return { action: "blocked", blockedUserId: args.blockedUserId };
        }
    },
});

export const getBlockedUsers = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const blocks = await ctx.db
            .query("userBlocks")
            .withIndex("by_blocker", (q) => q.eq("blockerId", userId as string))
            .collect();

        const blockedUsers = await Promise.all(
            blocks.map(async (block) => {
                const blockedUser = await ctx.db.get(block.blockedId as any);
                return {
                    id: block._id,
                    userId: block.blockedId,
                    username: blockedUser?.username || "Unknown",
                    name: blockedUser?.name || null,
                    blockedAt: block.createdAt,
                };
            })
        );

        return blockedUsers;
    },
});

export const reportUser = mutation({
    args: {
        reportedUserId: v.string(),
        reason: v.union(
            v.literal("harassment"),
            v.literal("spam"),
            v.literal("inappropriate_behavior"),
            v.literal("fake_account"),
            v.literal("other")
        ),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Authentication required");

        if (userId as string === args.reportedUserId) {
            throw new Error("Cannot report yourself");
        }

        const now = Date.now();

        // Create user report
        const reportId = await ctx.db.insert("userReports", {
            reporterId: userId as string,
            reportedUserId: args.reportedUserId,
            reason: args.reason,
            description: args.description,
            status: "pending",
            createdAt: now,
            reviewedAt: undefined,
            reviewedBy: undefined,
            action: undefined,
        });

        console.log("👤 User Reported:", {
            reportId,
            reporterId: userId,
            reportedUserId: args.reportedUserId,
            reason: args.reason,
        });

        return { success: true, reportId };
    },
});

export const getPendingUserReports = query({
    args: {},
    handler: async (ctx) => {
        // Use requireStaff to check permissions
        await requireStaff(ctx);

        const pendingReports = await ctx.db
            .query("userReports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("desc")
            .take(100);

        // Hydrate each report with user info
        const hydratedReports = await Promise.all(
            (await pendingReports.collect()).map(async (report) => {
                const reporter = await ctx.db.get(report.reporterId as any);
                const reportedUser = await ctx.db.get(report.reportedUserId as any);

                return {
                    ...report,
                    reporterUsername: reporter?.username || reporter?.name || "Unknown",
                    reportedUsername: reportedUser?.username || "Unknown",
                    reportedName: reportedUser?.name || null,
                    reportedUserReviewCount: reportedUser ? await ctx.db
                        .query("itemReviews")
                        .withIndex("by_user", (q) => q.eq("userId", report.reportedUserId))
                        .collect()
                        .then(reviews => reviews.length) : 0,
                };
            })
        );

        return hydratedReports;
    },
});

export const reviewUserReport = mutation({
    args: {
        reportId: v.id("userReports"),
        action: v.union(v.literal("warned"), v.literal("suspended"), v.literal("banned"), v.literal("dismissed")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Use requireStaff to check permissions and get moderator info
        const moderator = await requireStaff(ctx);

        const report = await ctx.db.get(args.reportId);
        if (!report) throw new Error("Report not found");

        const now = Date.now();

        // Determine status based on action
        const status = args.action === "dismissed" ? "dismissed" : "resolved";

        // Update report status and action
        await ctx.db.patch(args.reportId, {
            status,
            reviewedBy: moderator._id as string,
            reviewedAt: now,
            action: args.action === "dismissed" ? undefined : args.action,
        });

        // Send notification to reported user (if not dismissed)
        if (args.action !== "dismissed") {
            const { internal } = await import("./_generated/api");
            await ctx.runMutation((internal as any).notifications.createNotificationInternal, {
                recipientId: report.reportedUserId,
                senderId: moderator._id,
                type: "moderation",
                targetType: "user",
                targetId: undefined,
                message: `Your account has received a ${args.action} action due to a report. Please review our community guidelines.`,
            });
        }

        console.log("👤 User Report Reviewed:", {
            reportId: args.reportId,
            action: args.action,
            reviewedBy: moderator._id,
        });

        return { success: true };
    },
});

// Automated spam detection
export const detectSpam = {
    review: (review: any): { isSpam: boolean; confidence: number; reasons: string[] } => {
        const reasons: string[] = [];
        let confidence = 0;

        // Check for suspicious patterns
        if (review.notes && review.notes.length > 0) {
            // Check for excessive caps
            const capsRatio = (review.notes.match(/[A-Z]/g) || []).length / review.notes.length;
            if (capsRatio > 0.7) {
                reasons.push("Excessive capitalization");
                confidence += 0.3;
            }

            // Check for repetitive characters
            if (/(.)\1{4,}/.test(review.notes)) {
                reasons.push("Repetitive characters");
                confidence += 0.4;
            }

            // Check for spam keywords
            const spamKeywords = ["buy now", "click here", "free money", "winner", "congratulations"];
            const lowerNotes = review.notes.toLowerCase();
            spamKeywords.forEach(keyword => {
                if (lowerNotes.includes(keyword)) {
                    reasons.push(`Spam keyword: ${keyword}`);
                    confidence += 0.5;
                }
            });
        }

        // Check for suspicious rating patterns
        if (review.overallRating === 5 || review.overallRating === 1) {
            // Very high or very low ratings can be suspicious if combined with other factors
            // This is just a signal, not definitive spam
            if (confidence > 0.3) {
                reasons.push("Extreme rating with other spam signals");
                confidence += 0.2;
            }
        }

        return {
            isSpam: confidence > 0.7,
            confidence: Math.min(confidence, 1),
            reasons: reasons.length > 0 ? reasons : ["No spam indicators"],
        };
    },
};

export const getContentModerationStats = query({
    args: {},
    handler: async (ctx) => {
        // Use requireStaff to check permissions
        await requireStaff(ctx);

        // Get moderation statistics
        const pendingFlags = await ctx.db
            .query("contentFlags")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(100);

        const recentFlags = await ctx.db
            .query("contentFlags")
            .order("desc")
            .take(100);

        const stats = {
            pending: (await pendingFlags.collect()).length,
            total: (await recentFlags.collect()).length,
            byReason: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            avgResponseTime: 0,
        };

        (await recentFlags.collect()).forEach(flag => {
            stats.byReason[flag.reason] = (stats.byReason[flag.reason] || 0) + 1;
            stats.byType[flag.contentType] = (stats.byType[flag.contentType] || 0) + 1;
        });

        return stats;
    },
});