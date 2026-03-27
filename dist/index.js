"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = require("./routes/auth.routes");
const pets_routes_1 = require("./routes/pets.routes");
const services_routes_1 = require("./routes/services.routes");
const bookings_routes_1 = require("./routes/bookings.routes");
const wallet_routes_1 = require("./routes/wallet.routes");
const providers_routes_1 = require("./routes/providers.routes");
const events_routes_1 = require("./routes/events.routes");
const admin_routes_1 = require("./routes/admin.routes");
const webhooks_routes_1 = require("./routes/webhooks.routes");
const notifications_routes_1 = require("./routes/notifications.routes");
const reviews_routes_1 = require("./routes/reviews.routes");
const slots_routes_1 = require("./routes/slots.routes");
const payments_routes_1 = require("./routes/payments.routes");
const chat_routes_1 = require("./routes/chat.routes");
const tracking_routes_1 = require("./routes/tracking.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ─── Security ───────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
// ─── Rate Limiting ──────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);
// ─── Parsing ────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Logging ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
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
app.use('/api/auth', auth_routes_1.authRouter);
app.use('/api/pets', pets_routes_1.petsRouter);
app.use('/api/services', services_routes_1.servicesRouter);
app.use('/api/bookings', bookings_routes_1.bookingsRouter);
app.use('/api/wallet', wallet_routes_1.walletRouter);
app.use('/api/providers', providers_routes_1.providersRouter);
app.use('/api/events', events_routes_1.eventsRouter);
app.use('/api/admin', admin_routes_1.adminRouter);
app.use('/api/webhooks', webhooks_routes_1.webhooksRouter);
app.use('/api/notifications', notifications_routes_1.notificationsRouter);
app.use('/api/reviews', reviews_routes_1.reviewsRouter);
app.use('/api/slots', slots_routes_1.slotsRouter);
app.use('/api/payments', payments_routes_1.paymentsRouter);
app.use('/api/chat', chat_routes_1.chatRouter);
app.use('/api/tracking', tracking_routes_1.trackingRouter);
// ─── 404 Handler ────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// ─── Global Error Handler ───────────────────────
app.use(error_middleware_1.errorHandler);
// ─── Start ──────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🐾 PetCare API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
exports.default = app;
//# sourceMappingURL=index.js.map