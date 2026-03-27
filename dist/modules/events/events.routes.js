"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const events_controller_1 = require("./events.controller");
const events_schema_1 = require("./events.schema");
const router = (0, express_1.Router)();
exports.eventsRouter = router;
// Public
router.get('/', (0, utils_1.asyncHandler)(events_controller_1.eventsController.list.bind(events_controller_1.eventsController)));
router.get('/:id', (0, utils_1.asyncHandler)(events_controller_1.eventsController.getById.bind(events_controller_1.eventsController)));
// Protected
router.post('/:id/purchase', middleware_1.authenticate, (0, utils_1.asyncHandler)(events_controller_1.eventsController.purchaseTicket.bind(events_controller_1.eventsController)));
router.get('/me/tickets', middleware_1.authenticate, (0, utils_1.asyncHandler)(events_controller_1.eventsController.getMyTickets.bind(events_controller_1.eventsController)));
router.post('/tickets/validate', middleware_1.authenticate, (0, middleware_1.validate)(events_schema_1.validateTicketSchema), (0, utils_1.asyncHandler)(events_controller_1.eventsController.validateTicket.bind(events_controller_1.eventsController)));
//# sourceMappingURL=events.routes.js.map