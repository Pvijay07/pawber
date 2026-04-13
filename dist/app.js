"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const middleware_1 = require("./shared/middleware");
const swagger_1 = require("./shared/lib/swagger");
// ─── Module Imports (New Architecture) ──────────
const auth_1 = require("./modules/auth");
const bookings_1 = require("./modules/bookings");
const services_1 = require("./modules/services");
const pets_1 = require("./modules/pets");
const wallet_1 = require("./modules/wallet");
const events_1 = require("./modules/events");
const notifications_1 = require("./modules/notifications");
const reviews_1 = require("./modules/reviews");
const providers_1 = require("./modules/providers");
const slots_1 = require("./modules/slots");
const payments_1 = require("./modules/payments");
const debug_routes_1 = require("./modules/debug/debug.routes");
const content_routes_1 = require("./modules/content.routes");
// ─── Legacy Module Shims (to be migrated) ───────
const admin_1 = require("./modules/admin");
const webhooks_1 = require("./modules/webhooks");
/**
 * Creates and configures the Express application.
 */
function createApp() {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    // ─── Health Check ───────────────────────────────
    app.get('/health', (_req, res) => {
        let routes = [];
        try {
            routes = require('express-list-endpoints')(app).map((r) => r.path);
        }
        catch (e) { }
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
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)(config_1.corsConfig));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, morgan_1.default)(config_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    // ─── API Routes (Flattened) ────────────────────
    app.use('/api/auth', auth_1.authRouter);
    app.use('/api/content', content_routes_1.contentRouter);
    app.use('/api/services', services_1.servicesRouter);
    app.use('/api/bookings', bookings_1.bookingsRouter);
    app.use('/api/pets', pets_1.petsRouter);
    app.use('/api/wallet', wallet_1.walletRouter);
    app.use('/api/events', events_1.eventsRouter);
    app.use('/api/notifications', notifications_1.notificationsRouter);
    app.use('/api/reviews', reviews_1.reviewsRouter);
    app.use('/api/providers', providers_1.providersRouter);
    app.use('/api/slots', slots_1.slotsRouter);
    app.use('/api/payments', payments_1.paymentsRouter);
    app.use('/api/admin', admin_1.adminRouter);
    app.use('/api/webhooks', webhooks_1.webhooksRouter);
    app.use('/api/debug', debug_routes_1.debugRouter);
    // ─── Swagger ────────────────────────────────────
    (0, swagger_1.setupSwagger)(app);
    // Rate Limiter at the bottom
    app.use('/api', middleware_1.apiLimiter);
    // ─── 404 & Error Handlers ───────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { message: 'Route not found' },
        });
    });
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map