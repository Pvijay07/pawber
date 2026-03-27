import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { RegisterProviderInput, UpdateProviderInput, UploadDocInput, AddServiceInput, BlockedDateInput, BidInput } from './providers.schema';

const log = createLogger('ProvidersService');

export class ProvidersService {

    async list(query: { category?: string; city?: string; limit: number; offset: number }): Promise<ServiceResult<any>> {
        let dbQuery = supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .eq('is_online', true)
            .is('deleted_at', null)
            .order('rating', { ascending: false })
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
            .from('service_requests')
            .select('status')
            .eq('id', input.request_id)
            .single();
        if (!existing || existing.status !== 'open') {
            return fail('Request not available', 400);
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
        if (error) return fail(error.message, 500);
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
}

export const providersService = new ProvidersService();
