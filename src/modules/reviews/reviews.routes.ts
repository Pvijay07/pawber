import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { reviewsController } from './reviews.controller';
import { createReviewSchema, replyReviewSchema } from './reviews.schema';

const router = Router();

// Public
router.get('/provider/:providerId', asyncHandler(reviewsController.getByProvider.bind(reviewsController)));

// Protected
router.post('/', authenticate, validate(createReviewSchema), asyncHandler(reviewsController.create.bind(reviewsController)));
router.patch('/:id/reply', authenticate, validate(replyReviewSchema), asyncHandler(reviewsController.reply.bind(reviewsController)));

export { router as reviewsRouter };
