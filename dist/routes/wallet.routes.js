"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
exports.walletRouter = (0, express_1.Router)();
exports.walletRouter.use(auth_middleware_1.authenticate);
// ─── Get Wallet Balance ─────────────────────────
exports.walletRouter.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', req.user.id)
            .single();
        if (error || !data) {
            // Auto-create if missing
            const { data: newWallet, error: createErr } = await supabase_1.supabaseAdmin
                .from('wallets')
                .insert({ user_id: req.user.id })
                .select()
                .single();
            if (createErr)
                throw new error_middleware_1.AppError('Failed to initialize wallet', 500);
            return res.json({ wallet: newWallet });
        }
        res.json({ wallet: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Transaction History ────────────────────
exports.walletRouter.get('/transactions', async (req, res, next) => {
    try {
        const { type, limit = '50', offset = '0' } = req.query;
        // Get wallet ID first
        const { data: wallet } = await supabase_1.supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', req.user.id)
            .single();
        if (!wallet)
            return res.json({ transactions: [] });
        let query = supabase_1.supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        if (type)
            query = query.eq('type', type);
        const { data, error } = await query;
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ transactions: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Add Funds (simulated — real flow uses payment gateway) ──
const addFundsSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100).max(50000),
    payment_method: zod_1.z.string().optional(),
});
exports.walletRouter.post('/add-funds', (0, validate_middleware_1.validate)(addFundsSchema), async (req, res, next) => {
    try {
        const { amount } = req.body;
        const { data: wallet, error: walletError } = await supabase_1.supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', req.user.id)
            .single();
        if (walletError || !wallet)
            throw new error_middleware_1.AppError('Wallet not found', 404);
        // Create transaction record
        await supabase_1.supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'credit',
            amount,
            description: 'Wallet top-up',
            reference_type: 'topup',
        });
        // Update balance
        const newBalance = (wallet.balance || 0) + amount;
        const { data: updatedWallet, error: updateError } = await supabase_1.supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id)
            .select()
            .single();
        if (updateError)
            throw new error_middleware_1.AppError('Failed to update balance', 500);
        res.json({
            wallet: updatedWallet,
            message: `₹${amount} added to your wallet`,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Pay from Wallet ────────────────────────────
const paySchema = zod_1.z.object({
    booking_id: zod_1.z.string().uuid(),
    amount: zod_1.z.number().min(1),
});
exports.walletRouter.post('/pay', (0, validate_middleware_1.validate)(paySchema), async (req, res, next) => {
    try {
        const { booking_id, amount } = req.body;
        const { data: wallet } = await supabase_1.supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', req.user.id)
            .single();
        if (!wallet)
            throw new error_middleware_1.AppError('Wallet not found', 404);
        if (wallet.balance < amount)
            throw new error_middleware_1.AppError('Insufficient wallet balance', 400);
        // Debit wallet
        const newBalance = wallet.balance - amount;
        await supabase_1.supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id);
        // Transaction record
        await supabase_1.supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            description: 'Booking payment',
            reference_id: booking_id,
            reference_type: 'booking',
        });
        // Create payment record
        await supabase_1.supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: req.user.id,
            order_id: `WLT-${Date.now()}`,
            payment_gateway: 'wallet',
            payment_method: 'wallet',
            amount,
            status: 'success',
        });
        // Update booking payment status
        await supabase_1.supabaseAdmin
            .from('bookings')
            .update({ payment_status: 'paid' })
            .eq('id', booking_id);
        // Create escrow
        await supabase_1.supabaseAdmin.from('escrow').insert({
            booking_id,
            amount,
            status: 'held',
        });
        res.json({
            message: 'Payment successful',
            balance: newBalance,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Update Auto-Recharge Settings ──────────────
const autoRechargeSchema = zod_1.z.object({
    auto_recharge: zod_1.z.boolean(),
    auto_recharge_threshold: zod_1.z.number().min(0).optional(),
    auto_recharge_amount: zod_1.z.number().min(100).optional(),
});
exports.walletRouter.patch('/auto-recharge', (0, validate_middleware_1.validate)(autoRechargeSchema), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('wallets')
            .update(req.body)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error)
            throw new error_middleware_1.AppError('Failed to update settings', 500);
        res.json({ wallet: data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=wallet.routes.js.map