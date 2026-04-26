import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { RegisterProviderInput, UpdateProviderInput, UploadDocInput, AddServiceInput, BlockedDateInput, BidInput } from './providers.schema';
import { communications } from '../../shared/lib/communications';
import { getIO } from '../../shared/lib/socket';

const log = createLogger('ProvidersService');

export class ProvidersService {

    async list(query: { category?: string; city?: string; limit: number; offset: number }): Promise<ServiceResult<any>> {
        let dbQuery = supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .eq('is_online', true)
            .is('deleted_at', null)
            .order('ranking_score', { ascending: false })
            .order('rating', { ascending: false }) // secondary sort
            .range(query.offset, query.offset + query.limit - 1);

        if (query.category) dbQuery = dbQuery.eq('category', query.category);
        if (query.city) dbQuery = dbQuery.ilike('city', `%${query.city}%`);

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);
        return ok({ providers: data });
    }

    async getById(id: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('providers')
            .select(`
                *,
                user:profiles(full_name, avatar_url, phone),
                provider_services(
                    service:services(id, name, description),
                    base_price
                ),
                reviews:reviews(id, rating, comment, created_at, user:profiles(full_name, avatar_url))
            `)
            .eq('id', id)
            .single();

        if (error || !data) return fail('Provider not found', 404);
        return ok({ provider: data });
    }

    async register(userId: string, input: RegisterProviderInput): Promise<ServiceResult<any>> {
        // Check existing
        const { data: existing } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existing) return fail('You are already registered as a provider', 409);

        const { data, error } = await supabaseAdmin
            .from('providers')
            .insert({
                ...input,
                user_id: userId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) return fail(error.message, 500);

        // Update user role
        await supabaseAdmin
            .from('profiles')
            .update({ role: 'provider' })
            .eq('id', userId);

        log.info('Provider registered', { userId, providerId: data.id });
        return ok({ provider: data, message: 'Registration submitted for approval' });
    }

    async updateMe(userId: string, input: UpdateProviderInput): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('providers')
            .update(input)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !data) return fail('Provider profile not found', 404);
        return ok({ provider: data });
    }

    async uploadDocument(userId: string, input: UploadDocInput): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return fail('Provider profile not found', 404);

        const { data, error } = await supabaseAdmin
            .from('provider_documents')
            .insert({
                ...input,
                provider_id: provider.id,
            })
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ document: data });
    }

    async getMyBookings(userId: string, status?: string): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return ok({ bookings: [] });

        let query = supabaseAdmin
            .from('bookings')
            .select(`
                *,
                user:profiles(full_name, phone, avatar_url),
                service:services(name),
                package:service_packages(package_name, duration_minutes),
                booking_pets(pet:pets(name, type, breed))
            `)
            .eq('provider_id', provider.id)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) return fail(error.message, 500);
        return ok({ bookings: data });
    }

    async addService(userId: string, input: AddServiceInput): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return fail('Provider profile not found', 404);

        const { data, error } = await supabaseAdmin
            .from('provider_services')
            .insert({
                ...input,
                provider_id: provider.id,
            })
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ provider_service: data });
    }

    // ---------- additional helpers ----------

    async getServicesByProvider(providerId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('provider_services')
            .select('*, service:services(*)')
            .eq('provider_id', providerId);
        if (error) return fail(error.message, 500);
        return ok({ services: data });
    }

    async getBookingsByProvider(providerId: string, status?: string): Promise<ServiceResult<any>> {
        let query = supabaseAdmin
            .from('bookings')
            .select(`
                *,
                user:profiles(full_name, phone, avatar_url),
                service:services(name),
                package:service_packages(package_name, duration_minutes),
                booking_pets(pet:pets(name, type, breed))
            `)
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data, error } = await query;
        if (error) return fail(error.message, 500);
        return ok({ bookings: data });
    }

    async getBids(providerId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('bids')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        if (error) return fail(error.message, 500);
        return ok({ bids: data });
    }

    async createBid(providerId: string, input: BidInput): Promise<ServiceResult<any>> {
        const { data: existing } = await supabaseAdmin
            .from('service_requests') // Assuming request_id references service_requests or bookings
            .select('status')
            .eq('id', input.request_id)
            .single();
        // Skip strict status check for bookings if it's not a service_request to avoid breaking compatibility
        // But for this demo, if it exists, it must be open/pending
        if (existing && existing.status !== 'open' && existing.status !== 'pending') {
            return fail('Request not available', 400);
        }

        // Bidding Limit Check
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('is_bidding_unlimited, free_bids_remaining')
            .eq('id', providerId)
            .single();

        if (!provider) return fail('Provider not found', 404);

        if (!provider.is_bidding_unlimited && provider.free_bids_remaining <= 0) {
            return fail('You have exhausted your free bids for today. Upgrade to unlimited bidding for ₹99/month or purchase extra bids.', 403);
        }

        const { data, error } = await supabaseAdmin
            .from('bids')
            .insert({
                provider_id: providerId,
                request_id: input.request_id,
                amount: input.amount,
                message: input.message,
                eta: input.eta,
            })
            .select()
            .single();
        if (error) return fail(error.message, 500);

        // Deduct a free bid if not unlimited
        if (!provider.is_bidding_unlimited) {
            await supabaseAdmin.from('providers')
                .update({ free_bids_remaining: provider.free_bids_remaining - 1 })
                .eq('id', providerId);
        }

        // Fetch booking/request to get user_id
        const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select('user_id, service:services(name)')
            .eq('id', input.request_id)
            .single();

        if (booking) {
            // Notify Client
            await communications.send({
                userId: booking.user_id,
                title: 'New Bid Received! 🏷️',
                body: `${provider.business_name} has placed a bid of ₹${input.amount} for ${booking.service?.name || 'your request'}.`,
                data: { 
                    type: 'new_bid', 
                    bookingId: input.request_id,
                    amount: input.amount.toString(),
                    providerName: provider.business_name
                }
            });

            // Socket Emit
            try {
                getIO().to(`booking_${input.request_id}`).emit('NEW_BID', {
                    bid: data,
                    provider: {
                        business_name: provider.business_name
                    }
                });
            } catch (e) {}
        }

        return ok({ bid: data });
    }

    async listBlockedDates(providerId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('blocked_dates')
            .select('*')
            .eq('provider_id', providerId);
        if (error) return fail(error.message, 500);
        return ok({ blocked_dates: data });
    }

    async addBlockedDate(providerId: string, input: BlockedDateInput): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('blocked_dates')
            .insert({ ...input, provider_id: providerId })
            .select()
            .single();
        if (error) return fail(error.message, 500);
        return ok({ blocked_date: data });
    }

    async removeBlockedDate(id: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from('blocked_dates')
            .delete()
            .eq('id', id);
        if (error) return fail(error.message, 500);
        return ok({});
    }

    async getPerformance(providerId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('bookings')
            .select('status')
            .eq('provider_id', providerId);
        if (error) {
            console.error('[ProvidersService.getPerformance] Error:', error);
            return fail(error.message, 500);
        }
        const total = data?.length || 0;
        const completed = data?.filter((b: any) => b.status === 'completed').length || 0;
        const cancelled = data?.filter((b: any) => b.status === 'cancelled').length || 0;
        const accepted = data?.filter((b: any) => ['confirmed', 'in_progress', 'completed'].includes(b.status)).length || 0;
        return ok({
            performance: {
                acceptance_rate: total ? Math.round((accepted / total) * 100) : 0,
                cancellation_rate: total ? Math.round((cancelled / total) * 100) : 0,
                completion_rate: total ? Math.round((completed / total) * 100) : 0,
                peak_hours: [],
                avg_response_time: 'N/A'
            }
        });
    }

    async getWalletSummary(providerId: string): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('user_id,commission_rate')
            .eq('id', providerId)
            .single();
        if (!provider) return fail('Provider not found', 404);

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', provider.user_id)
            .single();
        const { data: escrowRows } = await supabaseAdmin
            .from('bookings')
            .select('escrow_amount')
            .eq('provider_id', providerId)
            .eq('escrow_status', 'held');
        const escrow_pending = escrowRows?.reduce((s: any, r: any) => s + (r.escrow_amount || 0), 0) || 0;

        const { data: transactions } = await supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet?.id)
            .order('created_at', { ascending: false })
            .limit(20);

        return ok({
            wallet: {
                available_balance: wallet?.balance || 0,
                escrow_pending,
                commission_rate: provider.commission_rate || 0,
                transactions
            }
        });
    }

    async getTransactionsByProvider(providerId: string, query: { type?: string; limit: number; offset: number }): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!provider) return ok({ transactions: [] });

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', provider.user_id)
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

    async getEventsByProvider(providerId: string): Promise<ServiceResult<any>> {
        // provider.user_id corresponds to organizer_id in events
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!provider) return ok({ events: [] });

        const { data, error } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('organizer_id', provider.user_id)
            .order('event_date', { ascending: true });
        if (error) return fail(error.message, 500);
        return ok({ events: data });
    }

    async getMyProfile(userId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('providers')
            .select(`
                *,
                user:profiles(full_name, avatar_url, phone)
            `)
            .eq('user_id', userId)
            .single();
        if (error || !data) return fail('Provider profile not found', 404);
        return ok({ provider: data });
    }

    // ─── Lead Unlock System ─────────────────────────────
    async unlockLead(providerId: string, bookingId: string): Promise<ServiceResult<any>> {
        // 1. Verify provider
        const { data: provider } = await supabaseAdmin.from('providers').select('id, user_id, is_certified').eq('id', providerId).single();
        if (!provider) return fail('Provider not found', 404);

        // 2. Verify booking is a premium lead
        const { data: booking } = await supabaseAdmin.from('bookings').select('id, status, is_premium_lead').eq('id', bookingId).single();
        if (!booking || booking.status !== 'pending') return fail('Booking is no longer available', 404);
        if (!booking.is_premium_lead) return fail('This is a basic lead and does not require unlocking', 400);

        // 3. Deduct from Wallet (Assuming cost is ₹30 for Premium Lead)
        const unlockCost = 30;
        const { data: wallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', provider.user_id).single();
        if (!wallet || wallet.balance < unlockCost) {
            return fail('Insufficient wallet balance to unlock lead. Please recharge.', 402);
        }

        // Deduct
        await supabaseAdmin.from('wallets').update({ balance: wallet.balance - unlockCost }).eq('id', wallet.id);
        
        // Log transaction
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount: unlockCost,
            description: 'Premium Lead Unlock',
            reference_id: bookingId,
            reference_type: 'lead_unlock'
        });

        // 4. Record Unlock
        const { data, error } = await supabaseAdmin.from('lead_unlocks').insert({
            provider_id: providerId,
            booking_id: bookingId,
            amount_paid: unlockCost
        }).select().single();

        if (error) {
            // Rollback is tricky without tx, but we assume success for now
            return fail('Failed to unlock lead: ' + error.message, 500);
        }

        return ok({ lead_unlock: data, message: 'Premium lead unlocked successfully' });
    }

    // ─── Provider Subscriptions ─────────────────────────
    async purchaseSubscription(providerId: string, planType: 'bidding_unlimited' | 'certification_course'): Promise<ServiceResult<any>> {
        const costMap = {
            'bidding_unlimited': 99,
            'certification_course': 299
        };
        const cost = costMap[planType];

        const { data: provider } = await supabaseAdmin.from('providers').select('id, user_id').eq('id', providerId).single();
        if (!provider) return fail('Provider not found', 404);

        const { data: wallet } = await supabaseAdmin.from('wallets').select('id, balance').eq('user_id', provider.user_id).single();
        if (!wallet || wallet.balance < cost) {
            return fail(`Insufficient balance. Cost is ₹${cost}`, 402);
        }

        // Deduct from wallet
        await supabaseAdmin.from('wallets').update({ balance: wallet.balance - cost }).eq('id', wallet.id);
        
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            type: 'debit',
            amount: cost,
            description: `Purchased ${planType}`,
            reference_type: 'subscription'
        });

        // Record Subscription
        const expiresAt = planType === 'bidding_unlimited' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
            : null; // Certs don't expire for now

        const { data } = await supabaseAdmin.from('provider_subscriptions').insert({
            provider_id: providerId,
            plan_type: planType,
            amount_paid: cost,
            expires_at: expiresAt
        }).select().single();

        // Update provider
        let updates: any = {};
        if (planType === 'bidding_unlimited') {
            updates.is_bidding_unlimited = true;
            updates.bidding_subscription_expires_at = expiresAt;
        } else if (planType === 'certification_course') {
            // For demo, we grant certification immediately. In reality, it might require course completion.
            updates.is_certified = true;
            updates.certification_completed_at = new Date().toISOString();
        }

        await supabaseAdmin.from('providers').update(updates).eq('id', providerId);

        return ok({ subscription: data, message: `Successfully activated ${planType}` });
    }

    async getProviderIdByUserId(userId: string): Promise<string | null> {
        const { data, error } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (error || !data) return null;
        return data.id;
    }
}

export const providersService = new ProvidersService();
