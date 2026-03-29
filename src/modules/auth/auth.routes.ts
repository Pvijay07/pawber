import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { authLimiter } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { authController } from './auth.controller';
import { signUpSchema, signInSchema, updateProfileSchema, refreshTokenSchema } from './auth.schema';

const router = Router();

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
router.post('/signup', authLimiter, validate(signUpSchema), asyncHandler(authController.signUp.bind(authController)));

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
router.post('/signin', authLimiter, validate(signInSchema), asyncHandler(authController.signIn.bind(authController)));

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
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken.bind(authController)));

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
router.get('/me', authenticate, asyncHandler(authController.getProfile.bind(authController)));

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
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile.bind(authController)));

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Logout and revoke token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 */
router.post('/signout', authenticate, asyncHandler(authController.signOut.bind(authController)));

export { router as authRouter };
