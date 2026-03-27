"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTicketSchema = exports.purchaseTicketSchema = void 0;
const zod_1 = require("zod");
exports.purchaseTicketSchema = zod_1.z.object({
    event_id: zod_1.z.string().uuid(),
});
exports.validateTicketSchema = zod_1.z.object({
    qr_code: zod_1.z.string().min(1),
});
//# sourceMappingURL=events.schema.js.map