"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const payments_controller_1 = require("./payments.controller");
const payments_schema_1 = require("./payments.schema");
const router = (0, express_1.Router)();
exports.paymentsRouter = router;
router.use(middleware_1.authenticate);
router.get('/', (0, utils_1.asyncHandler)(payments_controller_1.paymentsController.getHistory.bind(payments_controller_1.paymentsController)));
router.post('/create-order', (0, middleware_1.validate)(payments_schema_1.createOrderSchema), (0, utils_1.asyncHandler)(payments_controller_1.paymentsController.createOrder.bind(payments_controller_1.paymentsController)));
router.post('/verify', (0, middleware_1.validate)(payments_schema_1.verifyPaymentSchema), (0, utils_1.asyncHandler)(payments_controller_1.paymentsController.verifyPayment.bind(payments_controller_1.paymentsController)));
router.post('/refund', (0, middleware_1.validate)(payments_schema_1.refundSchema), (0, utils_1.asyncHandler)(payments_controller_1.paymentsController.refund.bind(payments_controller_1.paymentsController)));
//# sourceMappingURL=payments.routes.js.map