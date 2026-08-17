import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Security and authorization utilities

export const validateInput = {
    email: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    username: (username: string) => {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    rating: (rating: number) => {
        return rating >= 1 && rating <= 5 && Number.isInteger(rating);
    },

    text: (text: string, maxLength: number = 500) => {
        return typeof text === 'string' && text.length <= maxLength && text.length > 0;
    },

    url: (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
};

export const sanitizeInput = {
    text: (text: string) => {
        return text
            .trim()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    html: (html: string) => {
        // Basic HTML sanitization (in production, use a library like DOMPurify)
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },
};

// Security-focused rate limiting
export const rateLimitCheck = async (
    identifier: string, // Can be userId, email, or IP address
    action: string,
    limit: number,
    windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    // This integrates with the security rate limiter
    // Import and use the actual rate limiting functions
    try {
        const { checkRateLimit } = await import("./rate-limiter");
        return await checkRateLimit(identifier, action, limit, windowMs);
    } catch (error) {
        console.error("Rate limit check failed:", error);
        // Fail open for now, but log the error
        return {
            allowed: true,
            remaining: limit - 1,
            resetTime: Date.now() + windowMs,
        };
    }
};

export const requireAuth = async (ctx: any) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
        throw new Error("Authentication required");
    }
    return userId;
};

export const requireOwnership = async (ctx: any, resourceUserId: string) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
        throw new Error("Authentication required");
    }
    if (currentUserId !== resourceUserId) {
        throw new Error("Access denied: You don't own this resource");
    }
    return currentUserId;
};

export const checkPermission = async (
    ctx: any,
    permission: string
): Promise<boolean> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // In production, check against user roles and permissions
    const user = (await ctx.db.get(userId as any)) as any;
    if (!user) return false;

    const role = user.role || "user";

    const rolePermissions: Record<string, string[]> = {
        admin: ["all", "manage_users", "moderate_content", "view_analytics", "manage_settings"],
        moderator: ["moderate_content", "view_analytics"],
        developer: ["all", "view_analytics", "manage_settings"],
        owner: ["all"],
        user: [],
    };

    return rolePermissions[role]?.includes(permission) || false;
};

// Security monitoring mutations
export const logSecurityEvent = mutation({
    args: {
        eventType: v.string(),
        severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
        details: v.optional(v.record(v.string(), v.any())),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        const now = Date.now();

        const securityEvent = {
            eventType: args.eventType,
            severity: args.severity,
            userId: userId || "anonymous",
            details: args.details,
            timestamp: now,
            ip: "tracked", // In production, track actual IP
            userAgent: "tracked", // In production, track actual user agent
        };

        console.log("🔒 Security Event:", securityEvent);

        // Alert on critical security events
        if (args.severity === "critical") {
            console.error("🚨 CRITICAL SECURITY EVENT:", securityEvent);
        }

        return { logged: true, eventId: `sec_${now}` };
    },
});

export const getSecurityStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { authenticated: false, securityLevel: "none" };
        }

        const user = (await ctx.db.get(userId as any)) as any;
        if (!user) {
            return { authenticated: true, securityLevel: "basic" };
        }

        const securityLevel = user.role === "admin" || user.role === "owner" ? "full" :
                              user.role === "moderator" ? "elevated" :
                              user.role === "developer" ? "developer" : "basic";

        return {
            authenticated: true,
            securityLevel,
            userId,
            role: user.role,
        };
    },
});

// Input validation mutation for client-side validation requests
export const validateUserInput = query({
    args: {
        type: v.union(v.literal("email"), v.literal("username"), v.literal("text"), v.literal("url")),
        value: v.string(),
        maxLength: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let isValid = false;
        let message = "";

        switch (args.type) {
            case "email":
                isValid = validateInput.email(args.value);
                message = isValid ? "Valid email format" : "Invalid email format";
                break;
            case "username":
                isValid = validateInput.username(args.value);
                message = isValid ? "Valid username" : "Username must be 3-20 characters, letters, numbers, and underscores only";
                break;
            case "text":
                isValid = validateInput.text(args.value, args.maxLength);
                message = isValid ? "Valid text input" : `Text must be 1-${args.maxLength || 500} characters`;
                break;
            case "url":
                isValid = validateInput.url(args.value);
                message = isValid ? "Valid URL format" : "Invalid URL format";
                break;
        }

        return {
            isValid,
            message,
            sanitizedValue: isValid ? sanitizeInput.text(args.value) : args.value,
        };
    },
});