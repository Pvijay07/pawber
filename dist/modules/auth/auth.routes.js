"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const middleware_2 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const auth_controller_1 = require("./auth.controller");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
exports.authRouter = router;
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login functionality
 */
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, full_name]
 *             properties:
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, example: secret123, minLength: 6 }
 *               full_name: { type: string, example: John Doe }
 *               phone: { type: string, example: "+919876543210" }
 *               role: { type: string, enum: [client, provider], default: client }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error
 */
router.post('/signup', middleware_2.authLimiter, (0, middleware_1.validate)(auth_schema_1.signUpSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.signUp.bind(auth_controller_1.authController)));
/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Login and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/signin', middleware_2.authLimiter, (0, middleware_1.validate)(auth_schema_1.signInSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.signIn.bind(auth_controller_1.authController)));
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 */
router.post('/refresh', (0, middleware_1.validate)(auth_schema_1.refreshTokenSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController)));
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful profile retrieval
 */
router.get('/me', middleware_1.authenticate, (0, utils_1.asyncHandler)(auth_controller_1.authController.getProfile.bind(auth_controller_1.authController)));
/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     summary: Update profile details
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               avatar_url: { type: string }
 */
router.patch('/me', middleware_1.authenticate, (0, middleware_1.validate)(auth_schema_1.updateProfileSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.updateProfile.bind(auth_controller_1.authController)));
/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Logout and revoke token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 */
router.post('/signout', middleware_1.authenticate, (0, utils_1.asyncHandler)(auth_controller_1.authController.signOut.bind(auth_controller_1.authController)));
//# sourceMappingURL=auth.routes.js.map