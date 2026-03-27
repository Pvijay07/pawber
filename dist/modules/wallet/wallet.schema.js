"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoRechargeSchema = exports.paySchema = exports.addFundsSchema = void 0;
const zod_1 = require("zod");
exports.addFundsSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100).max(50000),
    payment_method: zod_1.z.string().optional(),
});
exports.paySchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(1),
});
exports.autoRechargeSchema = zod_1.z.object({
    auto_recharge: zod_1.z.boolean(),
    auto_recharge_threshold: zod_1.z.number().min(0).optional(),
    auto_recharge_amount: zod_1.z.number().min(100).optional(),
});
//# sourceMappingURL=wallet.schema.js.map