"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePetSchema = exports.createPetSchema = void 0;
const zod_1 = require("zod");
exports.createPetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().optional(),
    breed: zod_1.z.string().optional(),
    age: zod_1.z.number().int().min(0).optional(),
    weight: zod_1.z.number().min(0).optional(),
    medical_notes: zod_1.z.string().optional(),
    vaccination_status: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional(),
});
exports.updatePetSchema = exports.createPetSchema.partial();
//# sourceMappingURL=pets.schema.js.map