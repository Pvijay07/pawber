import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { authLimiter } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { authController } from './auth.controller';
import { signUpSchema, signInSchema, updateProfileSchema, refreshTokenSchema } from './auth.schema';

const router = Router();

// Public routes (with stricter rate limiting)
router.post('/signup', authLimiter, validate(signUpSchema), asyncHandler(authController.signUp.bind(authController)));
router.post('/signin', authLimiter, validate(signInSchema), asyncHandler(authController.signIn.bind(authController)));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken.bind(authController)));

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getProfile.bind(authController)));
router.patch('/me', authenticate, validate(updateProfileSchema), asyncHandler(authController.updateProfile.bind(authController)));
router.post('/signout', authenticate, asyncHandler(authController.signOut.bind(authController)));

export { router as authRouter };
