import { CorsOptions } from 'cors';
import { env } from './env';

export const corsConfig: CorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 86400, // 24 hours preflight cache
};
