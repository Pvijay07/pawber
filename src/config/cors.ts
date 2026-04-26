import { CorsOptions } from 'cors';
import { env } from './env';

const whitelist = [
    'http://localhost:5173',  // Web Client (Vite)
    'http://localhost:8081',  // Mobile Expo (Web)
    'http://localhost:19000', // Expo Go
    'http://localhost:19006', // Expo Web (legacy)
    'http://localhost:4173',  // Vite Preview
    'https://pawber.onrender.com',
];

export const corsConfig: CorsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Normalize origin for comparison (remove trailing slashes)
        const normalizedOrigin = origin.replace(/\/$/, "");

        const isWhitelisted = whitelist.some(item => item.replace(/\/$/, "") === normalizedOrigin);

        if (isWhitelisted || normalizedOrigin.includes('onrender.com') || env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(null, false); // Return false instead of Error to avoid triggering error handler without headers
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400,
};
