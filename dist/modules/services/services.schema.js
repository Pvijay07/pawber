"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddonSchema = exports.createPackageSchema = exports.createServiceSchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    icon_url: zod_1.z.string().url().optional(),
    sort_order: zod_1.z.number().int().optional(),
    is_active: zod_1.z.boolean().default(true),
});
exports.createServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    category_id: zod_1.z.string().uuid(),
    image_url: zod_1.z.string().url().optional(),
    is_active: zod_1.z.boolean().default(true),
});
exports.createPackageSchema = zod_1.z.object({
    package_name: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().min(0),
    duration_minutes: zod_1.z.number().int().optional(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    sort_order: zod_1.z.number().int().optional(),
    is_instant_available: zod_1.z.boolean().default(true),
    is_scheduled_available: zod_1.z.boolean().default(true),
});
exports.createAddonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    price: zod_1.z.number().min(0),
    duration_minutes: zod_1.z.number().int().optional(),
    is_active: zod_1.z.boolean().default(true),
});
//# sourceMappingURL=services.schema.js.map