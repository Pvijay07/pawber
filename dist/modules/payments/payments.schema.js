"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundSchema = exports.verifyPaymentSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(1),
});
exports.verifyPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string(),
    razorpay_payment_id: zod_1.z.string(),
    razorpay_signature: zod_1.z.string(),
});
exports.refundSchema = zod_1.z.object({
    payment_id: zod_1.z.string(),
    amount: zod_1.z.number().min(1).optional(),
    reason: zod_1.z.string().optional(),
});
//# sourceMappingURL=payments.schema.js.map