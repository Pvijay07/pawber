import dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),

    // Database
    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASS: z.string().default(''),
    DB_NAME: z.string().default('pawber'),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000), // 15 minutes
    RATE_LIMIT_MAX: z.coerce.number().default(100),

    // Razorpay
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),

    // JWT
    JWT_SECRET: z.string().optional(),
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

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
