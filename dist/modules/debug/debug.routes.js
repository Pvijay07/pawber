"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Debug endpoint to trace auth flow step-by-step.
 * Mimics auth middleware logic with full diagnostics.
 */
router.get('/auth-test', async (req, res) => {
    const { supabaseAdmin } = await Promise.resolve().then(() => __importStar(require('../../shared/lib/supabase')));
    const steps = {};
    try {
        const authHeader = req.headers.authorization;
        steps.hasAuthHeader = !!authHeader;
        steps.headerPrefix = authHeader?.substring(0, 10);
        if (!authHeader?.startsWith('Bearer ')) {
            return res.json({ success: false, steps, error: 'No bearer token' });
        }
        const token = authHeader.split(' ')[1];
        steps.tokenLength = token.length;
        steps.tokenStart = token.substring(0, 20);
        // Step 1: Verify token with Supabase
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        steps.getUserResult = { user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null, error: userError?.message || null };
        if (userError || !userData?.user) {
            return res.json({ success: false, steps, error: 'Token invalid' });
        }
        // Step 2: Query profiles
        const userId = userData.user.id;
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', userId)
            .single();
        steps.profileQuery = { profile, error: profileError?.message || null };
        return res.json({ success: true, steps });
    }
    catch (err) {
        steps.exception = err.message;
        return res.json({ success: false, steps, error: err.message });
    }
});
//# sourceMappingURL=debug.routes.js.map