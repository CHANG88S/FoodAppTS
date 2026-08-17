import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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

        // Log moderation event
        console.log("🚩 Content Flagged:", {
            flagId,
            contentType: args.contentType,
            contentId: args.contentId,
            reason: args.reason,
            reportedBy: userId,
        });

        return { success: true, flagId };
    },
});

export const getPendingFlags = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        // Check if user is moderator/admin
        const user = await ctx.db.get(userId as any);
        if (!user || (user.role !== "moderator" && user.role !== "admin" && user.role !== "owner")) {
            return [];
        }

        const pendingFlags = await ctx.db
            .query("contentFlags")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        return pendingFlags;
    },
});

export const reviewFlag = mutation({
    args: {
        flagId: v.string(),
        action: v.union(v.literal("approve"), v.literal("reject"), v.literal("remove_content")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Authentication required");

        // Check if user is moderator/admin
        const user = await ctx.db.get(userId as any);
        if (!user || (user.role !== "moderator" && user.role !== "admin" && user.role !== "owner")) {
            throw new Error("Insufficient permissions");
        }

        const flag = await ctx.db.get(args.flagId as any);
        if (!flag) throw new Error("Flag not found");

        const now = Date.now();

        // Update flag status
        await ctx.db.patch(args.flagId as any, {
            status: "reviewed",
            reviewedBy: userId as string,
            reviewedAt: now,
            notes: args.notes,
        });

        // Take action based on decision
        if (args.action === "remove_content") {
            // Remove the flagged content
            if (flag.contentType === "review") {
                await ctx.db.delete(flag.contentId as any);
            } else if (flag.contentType === "tweet") {
                await ctx.db.delete(flag.contentId as any);
            } else if (flag.contentType === "comment") {
                // For comments, we need to remove from the parent's comment array
                // This would require additional logic based on your data structure
            }
        }

        console.log("🛡️ Flag Reviewed:", {
            flagId: args.flagId,
            action: args.action,
            reviewedBy: userId,
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
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { error: "Authentication required" };
        }

        const user = await ctx.db.get(userId as any);
        if (!user || (user.role !== "admin" && user.role !== "owner" && user.role !== "moderator")) {
            return { error: "Insufficient permissions" };
        }

        // Get moderation statistics
        const pendingFlags = await ctx.db
            .query("contentFlags")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const recentFlags = await ctx.db
            .query("contentFlags")
            .take(100)
            .collect();

        const stats = {
            pending: pendingFlags.length,
            total: recentFlags.length,
            byReason: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            avgResponseTime: 0, // Would calculate from reviewed flags
        };

        recentFlags.forEach(flag => {
            stats.byReason[flag.reason] = (stats.byReason[flag.reason] || 0) + 1;
            stats.byType[flag.contentType] = (stats.byType[flag.contentType] || 0) + 1;
        });

        return stats;
    },
});