"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = exports.WalletService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('WalletService');
class WalletService {
    async getOrCreate(userId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (data)
            return (0, types_1.ok)({ wallet: data });
        // Auto-create if missing
        const { data: newWallet, error: createErr } = await lib_1.supabaseAdmin
            .from('wallets')
            .insert({ user_id: userId })
            .select()
            .single();
        if (createErr)
            return (0, types_1.fail)('Failed to initialize wallet', 500);
        return (0, types_1.ok)({ wallet: newWallet });
    }
    async getTransactions(userId, query) {
        const { data: wallet } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!wallet)
            return (0, types_1.ok)({ transactions: [] });
        let dbQuery = lib_1.supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);
        if (query.type)
            dbQuery = dbQuery.eq('type', query.type);
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ transactions: data });
    }
    async addFunds(userId, input) {
        const { data: wallet, error: walletError } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .single();
        if (walletError || !wallet)
            return (0, types_1.fail)('Wallet not found', 404);
        await lib_1.supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'credit',
            amount: input.amount,
            description: 'Wallet top-up',
            reference_type: 'topup',
        });
        const newBalance = (wallet.balance || 0) + input.amount;
        const { data: updatedWallet, error: updateError } = await lib_1.supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id)
            .select()
            .single();
        if (updateError)
            return (0, types_1.fail)('Failed to update balance', 500);
        log.info('Funds added', { userId, amount: input.amount });
        return (0, types_1.ok)({ wallet: updatedWallet, message: `₹${input.amount} added to your wallet` });
    }
    async pay(userId, input) {
        const { booking_id, amount } = input;
        const { data: wallet } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .single();
        if (!wallet)
            return (0, types_1.fail)('Wallet not found', 404);
        if (wallet.balance < amount)
            return (0, types_1.fail)('Insufficient wallet balance', 400);
        const newBalance = wallet.balance - amount;
        await lib_1.supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        await lib_1.supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            description: 'Booking payment',
            reference_id: booking_id,
            reference_type: 'booking',
        });
        await lib_1.supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: userId,
            order_id: `WLT-${Date.now()}`,
            payment_gateway: 'wallet',
            payment_method: 'wallet',
            amount,
            status: 'success',
        });
        await lib_1.supabaseAdmin.from('bookings').update({ payment_status: 'paid' }).eq('id', booking_id);
        await lib_1.supabaseAdmin.from('escrow').insert({ booking_id, amount, status: 'held' });
        log.info('Wallet payment', { userId, bookingId: booking_id, amount });
        return (0, types_1.ok)({ message: 'Payment successful', balance: newBalance });
    }
    async updateAutoRecharge(userId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('wallets')
            .update(input)
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to update settings', 500);
        return (0, types_1.ok)({ wallet: data });
    }
}
exports.WalletService = WalletService;
exports.walletService = new WalletService();
//# sourceMappingURL=wallet.service.js.map