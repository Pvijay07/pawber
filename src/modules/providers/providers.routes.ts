import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { providersController } from './providers.controller';
import { registerProviderSchema, updateProviderSchema, uploadDocSchema, addServiceSchema, blockedDateSchema, bidSchema } from './providers.schema';
import { supabaseAdmin } from '../../shared/lib';

const router = Router();

// Public
router.get('/', asyncHandler(providersController.list.bind(providersController)));
router.get('/:id', asyncHandler(providersController.getById.bind(providersController)));

// Protected
router.post('/register', authenticate, validate(registerProviderSchema), asyncHandler(providersController.register.bind(providersController)));

// Provider Only
router.patch('/me', authenticate, authorize('provider'), validate(updateProviderSchema), asyncHandler(providersController.updateMe.bind(providersController)));
router.post('/me/documents', authenticate, authorize('provider'), validate(uploadDocSchema), asyncHandler(providersController.uploadDocument.bind(providersController)));
router.get('/me/bookings', authenticate, authorize('provider'), asyncHandler(providersController.getMyBookings.bind(providersController)));
router.post('/me/services', authenticate, authorize('provider'), validate(addServiceSchema), asyncHandler(providersController.addService.bind(providersController)));

// new helper endpoints for provider features
router.get('/me', authenticate, authorize('provider'), asyncHandler(providersController.getMe.bind(providersController)));
router.get('/:id/services', asyncHandler(providersController.getServices.bind(providersController)));
router.get('/:id/bookings', authenticate, authorize('provider'), asyncHandler(providersController.getBookings.bind(providersController)));
router.get('/:id/bids', authenticate, authorize('provider'), asyncHandler(providersController.getBids.bind(providersController)));
router.post('/:id/bids', authenticate, authorize('provider'), validate(bidSchema), asyncHandler(providersController.createBid.bind(providersController)));

router.get('/:id/blocked-dates', asyncHandler(providersController.listBlockedDates.bind(providersController)));
router.post('/:id/blocked-dates', authenticate, authorize('provider'), validate(blockedDateSchema), asyncHandler(providersController.addBlockedDate.bind(providersController)));
router.delete('/blocked-dates/:blockedDateId', authenticate, authorize('provider'), asyncHandler(providersController.removeBlockedDate.bind(providersController)));

router.get('/:id/performance', asyncHandler(providersController.getPerformance.bind(providersController)));
router.get('/:id/wallet', authenticate, authorize('provider'), asyncHandler(providersController.getWallet.bind(providersController)));
router.get('/:id/transactions', authenticate, authorize('provider'), asyncHandler(providersController.getTransactions.bind(providersController)));
router.get('/:id/events', asyncHandler(providersController.getEvents.bind(providersController)));
router.post('/:id/location', authenticate, authorize('provider'), asyncHandler(async (req: any, res: any, next: any) => {
    try {
        // update provider location - verify ownership
        const providerId = req.params.id;
        const { latitude, longitude } = req.body;
        const { data: prov } = await supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!prov || prov.user_id !== req.user!.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { data, error } = await supabaseAdmin
            .from('providers')
            .update({ latitude, longitude })
            .eq('id', providerId)
            .select()
            .single();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ provider: data });
    } catch (err) {
        next(err);
    }
}));

export { router as providersRouter };
