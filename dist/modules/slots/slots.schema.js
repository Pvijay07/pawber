"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlotsSchema = void 0;
const zod_1 = require("zod");
exports.createSlotsSchema = zod_1.z.object({
    slots: zod_1.z.array(zod_1.z.object({
        slot_date: zod_1.z.string(), // YYYY-MM-DD
        start_time: zod_1.z.string(), // HH:MM
        end_time: zod_1.z.string(), // HH:MM
        capacity: zod_1.z.number().int().min(1).default(1),
    })).min(1),
});
//# sourceMappingURL=slots.schema.js.map