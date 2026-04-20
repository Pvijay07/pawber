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
import { contentRouter } from './modules/site-content.routes';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { expansionService } from './modules/bookings/expansion.service';

// ─── Legacy Module Shims (to be migrated) ───────
import { adminRouter } from './modules/admin';
import { webhooksRouter } from './modules/webhooks';

/**
 * Creates and configures the Express application.
 */
export function createApp() {
    const app = express();
    app.set('trust proxy', 1);

    // ─── Health Check ───────────────────────────────
    app.get('/health', (_req, res) => {
        let routes = [];
        try {
            routes = require('express-list-endpoints')(app).map((r: any) => r.path);
        } catch (e) {}
        
        res.json({
            success: true,
            data: {
                status: 'ok',
                version: '4.4.1',
                timestamp: new Date().toISOString(),
                commit: process.env.RENDER_GIT_COMMIT || 'development',
                routes_count: routes.length
            },
        });
    });

    // ─── Basic Middleware ───────────────────────────
    app.use(helmet());
    app.use(cors(corsConfig));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    
    // Rate Limiter
    app.use('/api', apiLimiter);

    // ─── API Routes (Flattened) ────────────────────
    app.use('/api/auth', authRouter);
    app.use('/api/content', contentRouter);
    app.use('/api/services', servicesRouter);
    app.use('/api/bookings', bookingsRouter);
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
    app.use('/api/loyalty', loyaltyRouter);
    app.use('/api/ai', aiRouter);
    app.use('/api/debug', debugRouter);

    // ─── Swagger ────────────────────────────────────
    setupSwagger(app);

    // ─── 404 & Error Handlers ───────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { message: 'Route not found' },
        });
    });

    // ─── Background Workers ─────────────────────────
    if (env.NODE_ENV !== 'test') {
        const EXPANSION_INTERVAL = 60 * 1000; // Check every 1 minute
        setInterval(() => {
            expansionService.processDueExpansions().catch(err => {
                console.error('Expansion Worker Error:', err);
            });
        }, EXPANSION_INTERVAL);
        console.log('⚡ Expansion worker started (Interval: 1m)');
    }

    return app;
}
