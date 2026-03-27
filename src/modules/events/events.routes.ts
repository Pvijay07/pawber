import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { eventsController } from './events.controller';
import { validateTicketSchema } from './events.schema';

const router = Router();

// Public
router.get('/', asyncHandler(eventsController.list.bind(eventsController)));
router.get('/:id', asyncHandler(eventsController.getById.bind(eventsController)));

// Protected
router.post('/:id/purchase', authenticate, asyncHandler(eventsController.purchaseTicket.bind(eventsController)));
router.get('/me/tickets', authenticate, asyncHandler(eventsController.getMyTickets.bind(eventsController)));
router.post('/tickets/validate', authenticate, validate(validateTicketSchema), asyncHandler(eventsController.validateTicket.bind(eventsController)));

export { router as eventsRouter };
