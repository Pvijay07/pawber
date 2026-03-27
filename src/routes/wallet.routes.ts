import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';

export const walletRouter = Router();
walletRouter.use(authenticate);

// ─── Get Wallet Balance ─────────────────────────
walletRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', req.user!.id)
            .single();

        if (error || !data) {
            // Auto-create if missing
            const { data: newWallet, error: createErr } = await supabaseAdmin
                .from('wallets')
                .insert({ user_id: req.user!.id })
                .select()
                .single();

            if (createErr) throw new AppError('Failed to initialize wallet', 500);
            return res.json({ wallet: newWallet });
        }

        res.json({ wallet: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Transaction History ────────────────────
walletRouter.get('/transactions', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { type, limit = '50', offset = '0' } = req.query;

        // Get wallet ID first
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!wallet) return res.json({ transactions: [] });

        let query = supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (type) query = query.eq('type', type as string);

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ transactions: data });
    } catch (err) {
        next(err);
    }
});

// ─── Add Funds (simulated — real flow uses payment gateway) ──
const addFundsSchema = z.object({
    amount: z.number().min(100).max(50000),
    payment_method: z.string().optional(),
});

walletRouter.post('/add-funds', validate(addFundsSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { amount } = req.body;

        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', req.user!.id)
            .single();

        if (walletError || !wallet) throw new AppError('Wallet not found', 404);

        // Create transaction record
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'credit',
            amount,
            description: 'Wallet top-up',
            reference_type: 'topup',
        });

        // Update balance
        const newBalance = (wallet.balance || 0) + amount;
        const { data: updatedWallet, error: updateError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id)
            .select()
            .single();

        if (updateError) throw new AppError('Failed to update balance', 500);

        res.json({
            wallet: updatedWallet,
            message: `₹${amount} added to your wallet`,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Pay from Wallet ────────────────────────────
const paySchema = z.object({
    booking_id: z.string().uuid(),
    amount: z.number().min(1),
});

walletRouter.post('/pay', validate(paySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { booking_id, amount } = req.body;

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', req.user!.id)
            .single();

        if (!wallet) throw new AppError('Wallet not found', 404);
        if (wallet.balance < amount) throw new AppError('Insufficient wallet balance', 400);

        // Debit wallet
        const newBalance = wallet.balance - amount;
        await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id);

        // Transaction record
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            description: 'Booking payment',
            reference_id: booking_id,
            reference_type: 'booking',
        });

        // Create payment record
        await supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: req.user!.id,
            order_id: `WLT-${Date.now()}`,
            payment_gateway: 'wallet',
            payment_method: 'wallet',
            amount,
            status: 'success',
        });

        // Update booking payment status
        await supabaseAdmin
            .from('bookings')
            .update({ payment_status: 'paid' })
            .eq('id', booking_id);

        // Create escrow
        await supabaseAdmin.from('escrow').insert({
            booking_id,
            amount,
            status: 'held',
        });

        res.json({
            message: 'Payment successful',
            balance: newBalance,
        });
    } catch (err) {
        next(err);
    }
});

// ─── Update Auto-Recharge Settings ──────────────
const autoRechargeSchema = z.object({
    auto_recharge: z.boolean(),
    auto_recharge_threshold: z.number().min(0).optional(),
    auto_recharge_amount: z.number().min(100).optional(),
});

walletRouter.patch('/auto-recharge', validate(autoRechargeSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('wallets')
            .update(req.body)
            .eq('user_id', req.user!.id)
            .select()
            .single();

        if (error) throw new AppError('Failed to update settings', 500);
        res.json({ wallet: data });
    } catch (err) {
        next(err);
    }
});
