"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const providers_controller_1 = require("./providers.controller");
const providers_schema_1 = require("./providers.schema");
const lib_1 = require("../../shared/lib");
const router = (0, express_1.Router)();
exports.providersRouter = router;
// Public
router.get('/', (0, utils_1.asyncHandler)(providers_controller_1.providersController.list.bind(providers_controller_1.providersController)));
router.get('/:id', (0, utils_1.asyncHandler)(providers_controller_1.providersController.getById.bind(providers_controller_1.providersController)));
// Protected
router.post('/register', middleware_1.authenticate, (0, middleware_1.validate)(providers_schema_1.registerProviderSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.register.bind(providers_controller_1.providersController)));
// Provider Only
router.patch('/me', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(providers_schema_1.updateProviderSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.updateMe.bind(providers_controller_1.providersController)));
router.post('/me/documents', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(providers_schema_1.uploadDocSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.uploadDocument.bind(providers_controller_1.providersController)));
router.get('/me/bookings', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getMyBookings.bind(providers_controller_1.providersController)));
router.post('/me/services', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(providers_schema_1.addServiceSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.addService.bind(providers_controller_1.providersController)));
// new helper endpoints for provider features
router.get('/me', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getMe.bind(providers_controller_1.providersController)));
router.get('/:id/services', (0, utils_1.asyncHandler)(providers_controller_1.providersController.getServices.bind(providers_controller_1.providersController)));
router.get('/:id/bookings', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getBookings.bind(providers_controller_1.providersController)));
router.get('/:id/bids', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getBids.bind(providers_controller_1.providersController)));
router.post('/:id/bids', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(providers_schema_1.bidSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.createBid.bind(providers_controller_1.providersController)));
router.get('/:id/blocked-dates', (0, utils_1.asyncHandler)(providers_controller_1.providersController.listBlockedDates.bind(providers_controller_1.providersController)));
router.post('/:id/blocked-dates', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(providers_schema_1.blockedDateSchema), (0, utils_1.asyncHandler)(providers_controller_1.providersController.addBlockedDate.bind(providers_controller_1.providersController)));
router.delete('/blocked-dates/:blockedDateId', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.removeBlockedDate.bind(providers_controller_1.providersController)));
router.get('/:id/performance', (0, utils_1.asyncHandler)(providers_controller_1.providersController.getPerformance.bind(providers_controller_1.providersController)));
router.get('/:id/wallet', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getWallet.bind(providers_controller_1.providersController)));
router.get('/:id/transactions', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(providers_controller_1.providersController.getTransactions.bind(providers_controller_1.providersController)));
router.get('/:id/events', (0, utils_1.asyncHandler)(providers_controller_1.providersController.getEvents.bind(providers_controller_1.providersController)));
router.post('/:id/location', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(async (req, res, next) => {
    try {
        // update provider location - verify ownership
        const providerId = req.params.id;
        const { latitude, longitude } = req.body;
        const { data: prov } = await lib_1.supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!prov || prov.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { data, error } = await lib_1.supabaseAdmin
            .from('providers')
            .update({ latitude, longitude })
            .eq('id', providerId)
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ provider: data });
    }
    catch (err) {
        next(err);
    }
}));
//# sourceMappingURL=providers.routes.js.map