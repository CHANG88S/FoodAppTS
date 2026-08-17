import { mutation, query } from "./_generated/server";
import { v } from "convex-values";

// Security-focused rate limiting configuration
const RATE_LIMITS = {
    LOGIN_ATTEMPTS_PER_15_MIN: 5,          // Prevent brute force attacks
    FAILED_LOGIN_ATTEMPTS_PER_HOUR: 10,    // Track repeated failures
    PASSWORD_RESET_PER_HOUR: 3,             // Prevent abuse of password reset
    PASSWORD_CHANGE_PER_HOUR: 3,            // Prevent abuse if account compromised
    EMAIL_VERIFICATION_PER_HOUR: 5,         // Prevent email verification abuse
};

// Rate limiting tracking entries
interface RateLimitEntry {
    identifier: string; // Can be userId, email, or IP
    action: string;
    timestamp: number;
    windowStart: number;
    count: number;
    failureCount?: number; // Track failed attempts separately
}

// In-memory rate limit tracking (for development - use Redis in production)
const rateLimitTracker = new Map<string, RateLimitEntry>();

function getWindowStart(windowMs: number): number {
    return Math.floor(Date.now() / windowMs) * windowMs;
}

function cleanupOldEntries(windowMs: number) {
    const cutoff = Date.now() - windowMs * 2;
    for (const [key, entry] of rateLimitTracker.entries()) {
        if (entry.timestamp < cutoff) {
            rateLimitTracker.delete(key);
        }
    }
}

export const checkRateLimit = async (
    identifier: string, // Can be userId, email, or IP address
    action: string,
    limit: number,
    windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    cleanupOldEntries(windowMs);

    const key = `${identifier}:${action}`;
    const windowStart = getWindowStart(windowMs);
    const now = Date.now();

    let entry = rateLimitTracker.get(key);

    if (!entry || entry.windowStart !== windowStart) {
        entry = {
            identifier,
            action,
            timestamp: now,
            windowStart,
            count: 1,
            failureCount: 0,
        };
        rateLimitTracker.set(key, entry);
        return {
            allowed: true,
            remaining: limit - 1,
            resetTime: windowStart + windowMs,
        };
    }

    if (entry.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: windowStart + windowMs,
        };
    }

    entry.count++;
    entry.timestamp = now;
    rateLimitTracker.set(key, entry);

    return {
        allowed: true,
        remaining: limit - entry.count,
        resetTime: windowStart + windowMs,
    };
};

// Track failed attempts (for login failures, etc.)
export const trackFailedAttempt = async (
    identifier: string,
    action: string,
    windowMs: number
): Promise<{ failureCount: number; blocked: boolean }> => {
    cleanupOldEntries(windowMs);

    const key = `${identifier}:${action}:failed`;
    const windowStart = getWindowStart(windowMs);
    const now = Date.now();

    let entry = rateLimitTracker.get(key);

    if (!entry || entry.windowStart !== windowStart) {
        entry = {
            identifier,
            action: `${action}:failed`,
            timestamp: now,
            windowStart,
            count: 1,
            failureCount: 1,
        };
        rateLimitTracker.set(key, entry);
        return {
            failureCount: 1,
            blocked: false,
        };
    }

    entry.failureCount = (entry.failureCount || 0) + 1;
    entry.timestamp = now;
    rateLimitTracker.set(key, entry);

    // Block after too many failures
    const blocked = entry.failureCount >= RATE_LIMITS.FAILED_LOGIN_ATTEMPTS_PER_HOUR;

    return {
        failureCount: entry.failureCount,
        blocked,
    };
};

// Reset rate limit (for successful login, etc.)
export const resetRateLimit = async (identifier: string, action: string): Promise<void> => {
    const key = `${identifier}:${action}`;
    rateLimitTracker.delete(key);

    // Also reset failed attempts
    const failedKey = `${identifier}:${action}:failed`;
    rateLimitTracker.delete(failedKey);
};

// Rate limit mutations for security monitoring
export const checkLoginRateLimit = mutation({
    args: {
        email: v.string(),
        attemptType: v.union(v.literal("success"), v.literal("failure")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const email = args.email.toLowerCase().trim();

        // Check login attempts limit (5 per 15 minutes)
        const loginKey = `login:${email}`;
        const windowMs = 15 * 60 * 1000; // 15 minutes
        const windowStart = Math.floor(now / windowMs) * windowMs;

        let loginEntry = rateLimitTracker.get(loginKey);

        if (!loginEntry || loginEntry.windowStart !== windowStart) {
            loginEntry = {
                identifier: email,
                action: "login",
                timestamp: now,
                windowStart,
                count: 1,
                failureCount: args.attemptType === "failure" ? 1 : 0,
            };
            rateLimitTracker.set(loginKey, loginEntry);
        } else {
            loginEntry.count++;
            if (args.attemptType === "failure") {
                loginEntry.failureCount = (loginEntry.failureCount || 0) + 1;
            }
            loginEntry.timestamp = now;
            rateLimitTracker.set(loginKey, loginEntry);
        }

        const allowed = loginEntry.count <= RATE_LIMITS.LOGIN_ATTEMPTS_PER_15_MIN;
        const remaining = Math.max(0, RATE_LIMITS.LOGIN_ATTEMPTS_PER_15_MIN - loginEntry.count);
        const resetTime = windowStart + windowMs;

        // Log security events for suspicious activity
        if (loginEntry.failureCount >= 3) {
            console.warn(`🔒 Multiple failed login attempts for ${email}: ${loginEntry.failureCount}`);
        }

        if (loginEntry.count >= RATE_LIMITS.LOGIN_ATTEMPTS_PER_15_MIN) {
            console.error(`🚨 Rate limit exceeded for login attempts: ${email}`);
        }

        return {
            allowed,
            remaining,
            resetTime,
            attemptCount: loginEntry.count,
            failureCount: loginEntry.failureCount || 0,
        };
    },
});

export const checkPasswordResetLimit = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const email = args.email.toLowerCase().trim();

        // Check password reset limit (3 per hour)
        const resetKey = `password_reset:${email}`;
        const windowMs = 60 * 60 * 1000; // 1 hour
        const windowStart = Math.floor(now / windowMs) * windowMs;

        let resetEntry = rateLimitTracker.get(resetKey);

        if (!resetEntry || resetEntry.windowStart !== windowStart) {
            resetEntry = {
                identifier: email,
                action: "password_reset",
                timestamp: now,
                windowStart,
                count: 1,
            };
            rateLimitTracker.set(resetKey, resetEntry);
        } else {
            resetEntry.count++;
            resetEntry.timestamp = now;
            rateLimitTracker.set(resetKey, resetEntry);
        }

        const allowed = resetEntry.count <= RATE_LIMITS.PASSWORD_RESET_PER_HOUR;
        const remaining = Math.max(0, RATE_LIMITS.PASSWORD_RESET_PER_HOUR - resetEntry.count);
        const resetTime = windowStart + windowMs;

        if (!allowed) {
            console.warn(`🔒 Password reset rate limit exceeded: ${email}`);
        }

        return {
            allowed,
            remaining,
            resetTime,
            attemptCount: resetEntry.count,
        };
    },
});

// Query to check current rate limit status
export const getRateLimitStatus = query({
    args: {
        action: v.union(
            v.literal("login"),
            v.literal("password_reset"),
            v.literal("password_change"),
            v.literal("email_verify")
        ),
    },
    handler: async (ctx, args) => {
        const userId = await ctx.auth.getUserId();
        if (!userId) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 3600000,
                limit: 0,
            };
        }

        const limits: Record<string, { limit: number; windowMs: number }> = {
            login: { limit: RATE_LIMITS.LOGIN_ATTEMPTS_PER_15_MIN, windowMs: 15 * 60 * 1000 },
            password_reset: { limit: RATE_LIMITS.PASSWORD_RESET_PER_HOUR, windowMs: 60 * 60 * 1000 },
            password_change: { limit: RATE_LIMITS.PASSWORD_CHANGE_PER_HOUR, windowMs: 60 * 60 * 1000 },
            email_verify: { limit: RATE_LIMITS.EMAIL_VERIFICATION_PER_HOUR, windowMs: 60 * 60 * 1000 },
        };

        const config = limits[args.action];
        if (!config) {
            return {
                allowed: true,
                remaining: 100,
                resetTime: Date.now() + 3600000,
                limit: 100,
            };
        }

        const result = await checkRateLimit(userId as string, args.action, config.limit, config.windowMs);
        return {
            ...result,
            limit: config.limit,
        };
    },
});