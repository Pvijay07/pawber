"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const slots_controller_1 = require("./slots.controller");
const slots_schema_1 = require("./slots.schema");
const router = (0, express_1.Router)();
exports.slotsRouter = router;
// Public
router.get('/provider/:providerId', (0, utils_1.asyncHandler)(slots_controller_1.slotsController.getByProvider.bind(slots_controller_1.slotsController)));
// Protected
router.post('/:slotId/lock', middleware_1.authenticate, (0, utils_1.asyncHandler)(slots_controller_1.slotsController.lockSlot.bind(slots_controller_1.slotsController)));
router.delete('/:slotId/lock', middleware_1.authenticate, (0, utils_1.asyncHandler)(slots_controller_1.slotsController.releaseLock.bind(slots_controller_1.slotsController)));
// Provider Only
router.get('/me', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(slots_controller_1.slotsController.getMySlots.bind(slots_controller_1.slotsController)));
router.post('/bulk', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, middleware_1.validate)(slots_schema_1.createSlotsSchema), (0, utils_1.asyncHandler)(slots_controller_1.slotsController.bulkCreate.bind(slots_controller_1.slotsController)));
router.patch('/:id/block', middleware_1.authenticate, (0, middleware_1.authorize)('provider'), (0, utils_1.asyncHandler)(slots_controller_1.slotsController.toggleBlock.bind(slots_controller_1.slotsController)));
//# sourceMappingURL=slots.routes.js.map