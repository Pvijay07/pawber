import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, corsConfig } from './config';
import { apiLimiter, errorHandler } from './shared/middleware';
import { setupSwagger } from './shared/lib/swagger';

// ─── Module Imports (New Architecture) ──────────
import { authRouter } from './modules/auth';
import { bookingsRouter } from './modules/bookings';
import { servicesRouter } from './modules/services';
import { petsRouter } from './modules/pets';
import { walletRouter } from './modules/wallet';
import { eventsRouter } from './modules/events';
import { notificationsRouter } from './modules/notifications';
import { reviewsRouter } from './modules/reviews';
import { providersRouter } from './modules/providers';
import { slotsRouter } from './modules/slots';
import { paymentsRouter } from './modules/payments';
import { debugRouter } from './modules/debug/debug.routes';
import { contentRouter } from './routes/content.routes';

// ─── Legacy Module Shims (to be migrated) ───────
import { adminRouter } from './modules/admin';
import { webhooksRouter } from './modules/webhooks';

/**
 * Creates and configures the Express application.
 * Separated from server.ts so it can be imported for testing.
 */
export function createApp() {
    const app = express();
    app.set('trust proxy', 1);

    // ─── Documentation ──────────────────────────────
    setupSwagger(app);


    // ─── Security ───────────────────────────────────
    app.use(helmet());
    app.use(cors(corsConfig));

    // ─── Rate Limiting ──────────────────────────────
    app.use('/api/', apiLimiter);

    // ─── Parsing ────────────────────────────────────
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ─── Logging ────────────────────────────────────
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // (Moved to bottom for full route visibility)

    // ─── API v1 Routes ──────────────────────────────
    const v1 = express.Router();

    // Fully migrated modules
    v1.use('/auth', authRouter);
    v1.use('/bookings', bookingsRouter);
    v1.use('/services', servicesRouter);
    v1.use('/pets', petsRouter);
    v1.use('/wallet', walletRouter);
    v1.use('/events', eventsRouter);
    v1.use('/notifications', notificationsRouter);
    v1.use('/reviews', reviewsRouter);
    v1.use('/providers', providersRouter);
    v1.use('/slots', slotsRouter);
    v1.use('/payments', paymentsRouter);

    // Legacy shims (same functionality, to be refactored)
    v1.use('/admin', adminRouter);
    v1.use('/webhooks', webhooksRouter);

    // Debug helpers
    v1.use('/debug', debugRouter);
    v1.use('/content', contentRouter);

    v1.get('/health', (_req, res) => {
        res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
    });

    v1.get('/routes', (req, res) => {
        const listEndpoints = require('express-list-endpoints');
        res.json({ success: true, routes: listEndpoints(app) });
    });

    app.use('/api', v1);


    app.get('/health', (_req, res) => {
        res.json({
            success: true,
            data: {
                status: 'ok',
                service: 'PetCare API',
                version: '4.0.0',
                timestamp: new Date().toISOString(),
                environment: env.NODE_ENV,
                supabaseKeyCheck: !!env.SUPABASE_SERVICE_ROLE_KEY,
                supabaseUrlCheck: !!env.SUPABASE_URL,
                rawUrlVal: env.SUPABASE_URL ? env.SUPABASE_URL.substring(0, 10) + '...' : null,
                allKeys: Object.keys(env).join(','),
                registeredRoutes: [
                    '/api/auth', '/api/debug/db', '/api/debug/auth-test', 
                    '/api/content/homepage', '/api/health', '/api/routes'
                ]
            },
        });
    });

    // ─── 404 Handler ────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { message: 'Route not found' },
        });
    });

    // ─── Global Error Handler ───────────────────────
    app.use(errorHandler);

    return app;
}
