"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().optional(),
});
exports.replyReviewSchema = zod_1.z.object({
    reply: zod_1.z.string().min(1),
});
//# sourceMappingURL=reviews.schema.js.map