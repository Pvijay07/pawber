/**
 * Default API rate limiter.
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Stricter rate limiter for auth routes (login, register, etc.)
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Lenient rate limiter for public read endpoints.
 */
export declare const publicLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.middleware.d.ts.map