import rateLimit from 'express-rate-limit';
import { env } from '../../config';

/**
 * Default API rate limiter.
 */
export const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests, please try again later.' },
    },
});

/**
 * Stricter rate limiter for auth routes (login, register, etc.)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many authentication attempts, please try again later.' },
    },
});

/**
 * Lenient rate limiter for public read endpoints.
 */
export const publicLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests, please try again later.' },
    },
});
