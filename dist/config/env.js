"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    // Database
    DATABASE_URL: zod_1.z.string().optional(),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.coerce.number().default(5432),
    DB_USER: zod_1.z.string().default('postgres'),
    DB_PASS: zod_1.z.string().default(''),
    DB_NAME: zod_1.z.string().default('pawber'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900_000), // 15 minutes
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    // Razorpay
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    // JWT
    JWT_SECRET: zod_1.z.string().optional(),
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const formatted = parsed.error.format();
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(formatted, null, 2));
        // Return with defaults for dev flexibility
        return envSchema.parse({
            ...process.env,
        });
    }
    return parsed.data;
}
exports.env = loadEnv();
//# sourceMappingURL=env.js.map