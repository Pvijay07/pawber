"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugRouter = void 0;
const express_1 = require("express");
const supabase_1 = require("../../shared/lib/supabase");
const env_1 = require("../../config/env");
const router = (0, express_1.Router)();
exports.debugRouter = router;
function mask(v) {
    if (!v)
        return null;
    try {
        const u = new URL(v);
        return `${u.protocol}//${u.hostname}`;
    }
    catch {
        return v && v.length > 8 ? `${v.slice(0, 6)}...${v.slice(-4)}` : v;
    }
}
router.get('/db', (_req, res) => {
    res.json({
        success: true,
        data: {
            host: env_1.env.DB_HOST,
            port: env_1.env.DB_PORT,
            user: env_1.env.DB_USER,
            database: env_1.env.DB_NAME,
            isUsingShim: (0, supabase_1.isSupabaseConfigured)(),
        },
    });
});
//# sourceMappingURL=debug.routes.js.map