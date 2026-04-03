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
// ─── Legacy Module Shims (to be migrated) ───────
const admin_1 = require("./modules/admin");
const webhooks_1 = require("./modules/webhooks");
/**
 * Creates and configures the Express application.
 * Separated from server.ts so it can be imported for testing.
 */
function createApp() {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    // ─── Documentation ──────────────────────────────
    (0, swagger_1.setupSwagger)(app);
    // ─── Security ───────────────────────────────────
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)(config_1.corsConfig));
    // ─── Rate Limiting ──────────────────────────────
    app.use('/api/', middleware_1.apiLimiter);
    // ─── Parsing ────────────────────────────────────
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // ─── Logging ────────────────────────────────────
    app.use((0, morgan_1.default)(config_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    app.get('/health', (_req, res) => {
        res.json({
            success: true,
            data: {
                status: 'ok',
                service: 'PetCare API',
                version: '4.0.0',
                timestamp: new Date().toISOString(),
                environment: config_1.env.NODE_ENV,
                supabaseKeyCheck: !!config_1.env.SUPABASE_SERVICE_ROLE_KEY,
                supabaseUrlCheck: !!config_1.env.SUPABASE_URL,
                rawUrlVal: config_1.env.SUPABASE_URL ? config_1.env.SUPABASE_URL.substring(0, 10) + '...' : null,
                allKeys: Object.keys(config_1.env).join(','),
                processEnvKeys: Object.keys(process.env).join(',')
            },
        });
    });
    // ─── API v1 Routes ──────────────────────────────
    const v1 = express_1.default.Router();
    // Fully migrated modules
    v1.use('/auth', auth_1.authRouter);
    v1.use('/bookings', bookings_1.bookingsRouter);
    v1.use('/services', services_1.servicesRouter);
    v1.use('/pets', pets_1.petsRouter);
    v1.use('/wallet', wallet_1.walletRouter);
    v1.use('/events', events_1.eventsRouter);
    v1.use('/notifications', notifications_1.notificationsRouter);
    v1.use('/reviews', reviews_1.reviewsRouter);
    v1.use('/providers', providers_1.providersRouter);
    v1.use('/slots', slots_1.slotsRouter);
    v1.use('/payments', payments_1.paymentsRouter);
    // Legacy shims (same functionality, to be refactored)
    v1.use('/admin', admin_1.adminRouter);
    v1.use('/webhooks', webhooks_1.webhooksRouter);
    // Debug helpers
    v1.use('/debug', debug_routes_1.debugRouter);
    v1.get('/health', (_req, res) => {
        res.json({ success: true, data: { status: 'ok' } });
    });
    app.use('/api', v1);
    // ─── 404 Handler ────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { message: 'Route not found' },
        });
    });
    // ─── Global Error Handler ───────────────────────
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map