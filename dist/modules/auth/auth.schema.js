"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.updateProfileSchema = exports.signInSchema = exports.signUpSchema = void 0;
const zod_1 = require("zod");
exports.signUpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    full_name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['client', 'provider']).default('client'),
});
exports.signInSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.updateProfileSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().url().optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().min(1),
});
//# sourceMappingURL=auth.schema.js.map