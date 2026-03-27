"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const wallet_controller_1 = require("./wallet.controller");
const wallet_schema_1 = require("./wallet.schema");
const router = (0, express_1.Router)();
exports.walletRouter = router;
router.use(middleware_1.authenticate);
router.get('/', (0, utils_1.asyncHandler)(wallet_controller_1.walletController.get.bind(wallet_controller_1.walletController)));
router.get('/transactions', (0, utils_1.asyncHandler)(wallet_controller_1.walletController.transactions.bind(wallet_controller_1.walletController)));
router.post('/add-funds', (0, middleware_1.validate)(wallet_schema_1.addFundsSchema), (0, utils_1.asyncHandler)(wallet_controller_1.walletController.addFunds.bind(wallet_controller_1.walletController)));
router.post('/pay', (0, middleware_1.validate)(wallet_schema_1.paySchema), (0, utils_1.asyncHandler)(wallet_controller_1.walletController.pay.bind(wallet_controller_1.walletController)));
router.patch('/auto-recharge', (0, middleware_1.validate)(wallet_schema_1.autoRechargeSchema), (0, utils_1.asyncHandler)(wallet_controller_1.walletController.autoRecharge.bind(wallet_controller_1.walletController)));
//# sourceMappingURL=wallet.routes.js.map