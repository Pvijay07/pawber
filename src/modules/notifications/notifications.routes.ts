import { Router } from 'express';
import { authenticate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { notificationsController } from './notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(notificationsController.list.bind(notificationsController)));
router.patch('/read-all', asyncHandler(notificationsController.markAllAsRead.bind(notificationsController)));
router.patch('/:id/read', asyncHandler(notificationsController.markAsRead.bind(notificationsController)));
router.delete('/:id', asyncHandler(notificationsController.delete.bind(notificationsController)));

export { router as notificationsRouter };
