import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Performance and monitoring system
export const logPerformance = mutation({
    args: {
        action: v.string(),
        duration: v.number(),
        metadata: v.optional(v.record(v.string(), v.any())),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const userId = await getAuthUserId(ctx);

        const performanceData = {
            action: args.action,
            duration: args.duration,
            userId: userId || "anonymous",
            timestamp: now,
            metadata: args.metadata,
        };

        // Log performance metrics (in production, send to monitoring service)
        console.log("⚡ Performance:", performanceData);

        // Alert on slow operations
        if (args.duration > 3000) {
            console.warn("⚠️ Slow Operation Detected:", performanceData);
        }

        return { logged: true };
    },
});

export const logError = mutation({
    args: {
        error: v.string(),
        stack: v.optional(v.string()),
        context: v.optional(v.record(v.string(), v.any())),
        severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        const now = Date.now();

        const errorData = {
            error: args.error,
            stack: args.stack,
            context: args.context,
            severity: args.severity || "medium",
            userId: userId || "anonymous",
            timestamp: now,
        };

        // Log errors (in production, send to error tracking service)
        console.error("❌ Error:", errorData);

        // Alert on critical errors
        if (args.severity === "critical") {
            console.error("🚨 CRITICAL ERROR:", errorData);
        }

        return { logged: true };
    },
});

export const getSystemHealth = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // Basic health check (in production, check database, services, etc.)
        return {
            status: "healthy",
            timestamp: now,
            uptime: process.uptime ? Math.floor(process.uptime()) : 0,
            memory: process.memoryUsage ? {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            } : null,
            services: {
                database: "connected",
                auth: "operational",
                storage: "available",
            },
        };
    },
});

export const getAPIUsageStats = query({
    args: {
        timeRange: v.optional(v.object({
            start: v.number(),
            end: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        // In production, query actual usage statistics
        const timeRange = args.timeRange || {
            start: Date.now() - 86400000, // 24 hours ago
            end: Date.now(),
        };

        return {
            timeRange,
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
            endpoints: {
                restaurants: { calls: 0, avgTime: 0 },
                reviews: { calls: 0, avgTime: 0 },
                users: { calls: 0, avgTime: 0 },
                search: { calls: 0, avgTime: 0 },
            },
        };
    },
});