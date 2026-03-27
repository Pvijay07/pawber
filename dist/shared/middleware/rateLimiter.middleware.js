"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../../config");
/**
 * Default API rate limiter.
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.env.RATE_LIMIT_WINDOW_MS,
    max: config_1.env.RATE_LIMIT_MAX,
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
exports.authLimiter = (0, express_rate_limit_1.default)({
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
exports.publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { message: 'Too many requests, please try again later.' },
    },
});
//# sourceMappingURL=rateLimiter.middleware.js.map