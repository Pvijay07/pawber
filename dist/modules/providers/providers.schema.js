"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bidSchema = exports.blockedDateSchema = exports.addServiceSchema = exports.uploadDocSchema = exports.updateProviderSchema = exports.registerProviderSchema = void 0;
const zod_1 = require("zod");
exports.registerProviderSchema = zod_1.z.object({
    business_name: zod_1.z.string().min(2),
    category: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    city: zod_1.z.string(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    service_radius_km: zod_1.z.number().int().min(1).max(100).optional(),
});
exports.updateProviderSchema = zod_1.z.object({
    business_name: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    service_radius_km: zod_1.z.number().int().min(1).max(100).optional(),
    is_online: zod_1.z.boolean().optional(),
});
exports.uploadDocSchema = zod_1.z.object({
    document_type: zod_1.z.string(),
    file_url: zod_1.z.string().url(),
});
exports.addServiceSchema = zod_1.z.object({
    service_id: zod_1.z.string().uuid(),
    base_price: zod_1.z.number().min(0),
});
// Additional schemas for provider-specific features
exports.blockedDateSchema = zod_1.z.object({
    date: zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), {
        message: 'Invalid date string',
    }),
    reason: zod_1.z.string().optional(),
});
exports.bidSchema = zod_1.z.object({
    request_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(0),
    message: zod_1.z.string().optional(),
    eta: zod_1.z.string().optional(),
});
//# sourceMappingURL=providers.schema.js.map