import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { AddFundsInput, PayInput, AutoRechargeInput } from './wallet.schema';

const log = createLogger('WalletService');

export class WalletService {
    async getOrCreate(userId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data) return ok({ wallet: data });

        // Auto-create if missing
        const { data: newWallet, error: createErr } = await supabaseAdmin
            .from('wallets')
            .insert({ user_id: userId })
            .select()
            .single();

        if (createErr) return fail('Failed to initialize wallet', 500);
        return ok({ wallet: newWallet });
    }

    async getTransactions(userId: string, query: { type?: string; limit: number; offset: number }): Promise<ServiceResult<any>> {
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!wallet) return ok({ transactions: [] });

        let dbQuery = supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);

        if (query.type) dbQuery = dbQuery.eq('type', query.type);

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);
        return ok({ transactions: data });
    }

    async addFunds(userId: string, input: AddFundsInput): Promise<ServiceResult<any>> {
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .single();

        if (walletError || !wallet) return fail('Wallet not found', 404);

        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'credit',
            amount: input.amount,
            description: 'Wallet top-up',
            reference_type: 'topup',
        });

        const newBalance = (wallet.balance || 0) + input.amount;
        const { data: updatedWallet, error: updateError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id)
            .select()
            .single();

        if (updateError) return fail('Failed to update balance', 500);

        log.info('Funds added', { userId, amount: input.amount });
        return ok({ wallet: updatedWallet, message: `₹${input.amount} added to your wallet` });
    }

    async pay(userId: string, input: PayInput): Promise<ServiceResult<any>> {
        const { booking_id, amount } = input;

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .single();

        if (!wallet) return fail('Wallet not found', 404);
        if (wallet.balance < amount) return fail('Insufficient wallet balance', 400);

        const newBalance = wallet.balance - amount;
        await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            description: 'Booking payment',
            reference_id: booking_id,
            reference_type: 'booking',
        });

        await supabaseAdmin.from('payments').insert({
            booking_id,
            user_id: userId,
            order_id: `WLT-${Date.now()}`,
            payment_gateway: 'wallet',
            payment_method: 'wallet',
            amount,
            status: 'success',
        });

        await supabaseAdmin.from('bookings').update({ payment_status: 'paid' }).eq('id', booking_id);
        await supabaseAdmin.from('escrow').insert({ booking_id, amount, status: 'held' });

        log.info('Wallet payment', { userId, bookingId: booking_id, amount });
        return ok({ message: 'Payment successful', balance: newBalance });
    }

    async updateAutoRecharge(userId: string, input: AutoRechargeInput): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('wallets')
            .update(input)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) return fail('Failed to update settings', 500);
        return ok({ wallet: data });
    }
}

export const walletService = new WalletService();
