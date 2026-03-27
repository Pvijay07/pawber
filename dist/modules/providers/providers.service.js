"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersService = exports.ProvidersService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('ProvidersService');
class ProvidersService {
    async list(query) {
        let dbQuery = lib_1.supabaseAdmin
            .from('providers')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .eq('is_online', true)
            .is('deleted_at', null)
            .order('rating', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);
        if (query.category)
            dbQuery = dbQuery.eq('category', query.category);
        if (query.city)
            dbQuery = dbQuery.ilike('city', `%${query.city}%`);
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ providers: data });
    }
    async getById(id) {
        const { data, error } = await lib_1.supabaseAdmin
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
        if (error || !data)
            return (0, types_1.fail)('Provider not found', 404);
        return (0, types_1.ok)({ provider: data });
    }
    async register(userId, input) {
        // Check existing
        const { data: existing } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (existing)
            return (0, types_1.fail)('You are already registered as a provider', 409);
        const { data, error } = await lib_1.supabaseAdmin
            .from('providers')
            .insert({
            ...input,
            user_id: userId,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        // Update user role
        await lib_1.supabaseAdmin
            .from('profiles')
            .update({ role: 'provider' })
            .eq('id', userId);
        log.info('Provider registered', { userId, providerId: data.id });
        return (0, types_1.ok)({ provider: data, message: 'Registration submitted for approval' });
    }
    async updateMe(userId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('providers')
            .update(input)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !data)
            return (0, types_1.fail)('Provider profile not found', 404);
        return (0, types_1.ok)({ provider: data });
    }
    async uploadDocument(userId, input) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider profile not found', 404);
        const { data, error } = await lib_1.supabaseAdmin
            .from('provider_documents')
            .insert({
            ...input,
            provider_id: provider.id,
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ document: data });
    }
    async getMyBookings(userId, status) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.ok)({ bookings: [] });
        let query = lib_1.supabaseAdmin
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
        if (status)
            query = query.eq('status', status);
        const { data, error } = await query;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ bookings: data });
    }
    async addService(userId, input) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider profile not found', 404);
        const { data, error } = await lib_1.supabaseAdmin
            .from('provider_services')
            .insert({
            ...input,
            provider_id: provider.id,
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ provider_service: data });
    }
    // ---------- additional helpers ----------
    async getServicesByProvider(providerId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('provider_services')
            .select('*, service:services(*)')
            .eq('provider_id', providerId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ services: data });
    }
    async getBookingsByProvider(providerId, status) {
        let query = lib_1.supabaseAdmin
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
        if (status)
            query = query.eq('status', status);
        const { data, error } = await query;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ bookings: data });
    }
    async getBids(providerId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('bids')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ bids: data });
    }
    async createBid(providerId, input) {
        const { data: existing } = await lib_1.supabaseAdmin
            .from('service_requests')
            .select('status')
            .eq('id', input.request_id)
            .single();
        if (!existing || existing.status !== 'open') {
            return (0, types_1.fail)('Request not available', 400);
        }
        const { data, error } = await lib_1.supabaseAdmin
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
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ bid: data });
    }
    async listBlockedDates(providerId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('blocked_dates')
            .select('*')
            .eq('provider_id', providerId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ blocked_dates: data });
    }
    async addBlockedDate(providerId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('blocked_dates')
            .insert({ ...input, provider_id: providerId })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ blocked_date: data });
    }
    async removeBlockedDate(id) {
        const { error } = await lib_1.supabaseAdmin
            .from('blocked_dates')
            .delete()
            .eq('id', id);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({});
    }
    async getPerformance(providerId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('bookings')
            .select('status')
            .eq('provider_id', providerId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        const total = data?.length || 0;
        const completed = data?.filter((b) => b.status === 'completed').length || 0;
        const cancelled = data?.filter((b) => b.status === 'cancelled').length || 0;
        const accepted = data?.filter((b) => ['confirmed', 'in_progress', 'completed'].includes(b.status)).length || 0;
        return (0, types_1.ok)({
            performance: {
                acceptance_rate: total ? Math.round((accepted / total) * 100) : 0,
                cancellation_rate: total ? Math.round((cancelled / total) * 100) : 0,
                completion_rate: total ? Math.round((completed / total) * 100) : 0,
                peak_hours: [],
                avg_response_time: 'N/A'
            }
        });
    }
    async getWalletSummary(providerId) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('user_id,commission_rate')
            .eq('id', providerId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider not found', 404);
        const { data: wallet } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', provider.user_id)
            .single();
        const { data: escrowRows } = await lib_1.supabaseAdmin
            .from('bookings')
            .select('escrow_amount')
            .eq('provider_id', providerId)
            .eq('escrow_status', 'held');
        const escrow_pending = escrowRows?.reduce((s, r) => s + (r.escrow_amount || 0), 0) || 0;
        const { data: transactions } = await lib_1.supabaseAdmin
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet?.id)
            .order('created_at', { ascending: false })
            .limit(20);
        return (0, types_1.ok)({
            wallet: {
                available_balance: wallet?.balance || 0,
                escrow_pending,
                commission_rate: provider.commission_rate || 0,
                transactions
            }
        });
    }
    async getTransactionsByProvider(providerId, query) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!provider)
            return (0, types_1.ok)({ transactions: [] });
        const { data: wallet } = await lib_1.supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', provider.user_id)
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
    async getEventsByProvider(providerId) {
        // provider.user_id corresponds to organizer_id in events
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('user_id')
            .eq('id', providerId)
            .single();
        if (!provider)
            return (0, types_1.ok)({ events: [] });
        const { data, error } = await lib_1.supabaseAdmin
            .from('events')
            .select('*')
            .eq('organizer_id', provider.user_id)
            .order('event_date', { ascending: true });
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ events: data });
    }
    async getMyProfile(userId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('providers')
            .select(`
                *,
                user:profiles(full_name, avatar_url, phone)
            `)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            return (0, types_1.fail)('Provider profile not found', 404);
        return (0, types_1.ok)({ provider: data });
    }
}
exports.ProvidersService = ProvidersService;
exports.providersService = new ProvidersService();
//# sourceMappingURL=providers.service.js.map