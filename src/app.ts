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
    app.use('/api', apiLimiter);

    // ─── Parsing ────────────────────────────────────
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ─── Logging ────────────────────────────────────
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // ─── API Routes (Flattened for reliability) ────
    app.use('/api/auth', authRouter);
    app.use('/api/bookings', bookingsRouter);
    app.use('/api/services', servicesRouter);
    app.use('/api/pets', petsRouter);
    app.use('/api/wallet', walletRouter);
    app.use('/api/events', eventsRouter);
    app.use('/api/notifications', notificationsRouter);
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/providers', providersRouter);
    app.use('/api/slots', slotsRouter);
    app.use('/api/payments', paymentsRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/webhooks', webhooksRouter);
    app.use('/api/debug', debugRouter);
    app.use('/api/content', contentRouter);

    // Experimental definitive route for verification
    app.use('/api/v2-health', (_req, res) => {
        res.json({ 
            success: true, 
            data: { 
                status: 'ok', 
                timestamp: new Date().toISOString(), 
                message: 'Flattened V2 DEFINITIVE',
                commit: process.env.RENDER_GIT_COMMIT || 'development'
            } 
        });
    });

    app.get('/health', (_req, res) => {
        // We use try-catch here to ensure health check never fails due to audit libraries
        let routes = [];
        try {
            routes = require('express-list-endpoints')(app).map((r: any) => r.path);
        } catch (e) {
            routes = ['audit-failed'];
        }
        
        res.json({
            success: true,
            data: {
                status: 'ok',
                version: '4.1.5',
                timestamp: new Date().toISOString(),
                commit: process.env.RENDER_GIT_COMMIT || 'development',
                registeredRoutes: routes
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
