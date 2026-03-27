import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth.routes';
import { petsRouter } from './routes/pets.routes';
import { servicesRouter } from './routes/services.routes';
import { bookingsRouter } from './routes/bookings.routes';
import { walletRouter } from './routes/wallet.routes';
import { providersRouter } from './routes/providers.routes';
import { eventsRouter } from './routes/events.routes';
import { adminRouter } from './routes/admin.routes';
import { webhooksRouter } from './routes/webhooks.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { reviewsRouter } from './routes/reviews.routes';
import { slotsRouter } from './routes/slots.routes';
import { paymentsRouter } from './routes/payments.routes';
import { chatRouter } from './routes/chat.routes';
import { trackingRouter } from './routes/tracking.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security ───────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// ─── Rate Limiting ──────────────────────────────
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Parsing ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ─── Health Check ───────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'PetCare API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ─────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/pets', petsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/providers', providersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tracking', trackingRouter);

// ─── 404 Handler ────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🐾 PetCare API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
