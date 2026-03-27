"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsService = exports.SlotsService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('SlotsService');
class SlotsService {
    async getByProvider(providerId, query) {
        let dbQuery = lib_1.supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', providerId)
            .eq('is_blocked', false)
            .order('slot_date')
            .order('start_time');
        if (query.date) {
            dbQuery = dbQuery.eq('slot_date', query.date);
        }
        else if (query.from_date && query.to_date) {
            dbQuery = dbQuery.gte('slot_date', query.from_date).lte('slot_date', query.to_date);
        }
        else {
            const today = new Date().toISOString().split('T')[0];
            const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dbQuery = dbQuery.gte('slot_date', today).lte('slot_date', week);
        }
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        const availableSlots = (data || []).map((slot) => ({
            ...slot,
            is_available: slot.booked_count < slot.capacity,
        }));
        // Cleanup expired locks
        await lib_1.supabaseAdmin
            .from('slot_locks')
            .delete()
            .lt('lock_expires_at', new Date().toISOString());
        return (0, types_1.ok)({ slots: availableSlots });
    }
    async lockSlot(userId, slotId) {
        const { data: slot } = await lib_1.supabaseAdmin
            .from('provider_slots')
            .select('capacity, booked_count, is_blocked')
            .eq('id', slotId)
            .single();
        if (!slot)
            return (0, types_1.fail)('Slot not found', 404);
        if (slot.is_blocked)
            return (0, types_1.fail)('Slot is blocked', 400);
        if (slot.booked_count >= slot.capacity)
            return (0, types_1.fail)('Slot is fully booked', 409);
        const { data: existingLocks } = await lib_1.supabaseAdmin
            .from('slot_locks')
            .select('id, user_id')
            .eq('slot_id', slotId)
            .gt('lock_expires_at', new Date().toISOString());
        const totalReserved = slot.booked_count + (existingLocks?.length || 0);
        if (totalReserved >= slot.capacity) {
            return (0, types_1.fail)('Slot is currently being booked by someone else. Try again shortly.', 409);
        }
        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);
        const { data: lock, error } = await lib_1.supabaseAdmin
            .from('slot_locks')
            .insert({
            slot_id: slotId,
            user_id: userId,
            lock_expires_at: lockExpiry.toISOString(),
        })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to lock slot', 500);
        return (0, types_1.ok)({
            lock,
            expires_at: lockExpiry.toISOString(),
            expires_in_seconds: 300,
            message: 'Slot locked for 5 minutes. Complete your booking before it expires.',
        });
    }
    async releaseLock(userId, slotId) {
        await lib_1.supabaseAdmin
            .from('slot_locks')
            .delete()
            .eq('slot_id', slotId)
            .eq('user_id', userId);
        return (0, types_1.ok)({ message: 'Lock released' });
    }
    async bulkCreate(userId, input) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider not found', 404);
        const slotsToInsert = input.slots.map(s => ({
            ...s,
            provider_id: provider.id,
        }));
        const { data, error } = await lib_1.supabaseAdmin
            .from('provider_slots')
            .insert(slotsToInsert)
            .select();
        if (error)
            return (0, types_1.fail)('Failed to create slots', 500);
        return (0, types_1.ok)({ slots: data, count: data.length });
    }
    async toggleBlock(userId, id) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.fail)('Provider not found', 404);
        const { data: slot } = await lib_1.supabaseAdmin
            .from('provider_slots')
            .select('is_blocked')
            .eq('id', id)
            .eq('provider_id', provider.id)
            .single();
        if (!slot)
            return (0, types_1.fail)('Slot not found', 404);
        const { data, error } = await lib_1.supabaseAdmin
            .from('provider_slots')
            .update({ is_blocked: !slot.is_blocked })
            .eq('id', id)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to update slot', 500);
        return (0, types_1.ok)({ slot: data });
    }
    async getMySlots(userId, query) {
        const { data: provider } = await lib_1.supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!provider)
            return (0, types_1.ok)({ slots: [] });
        let dbQuery = lib_1.supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', provider.id)
            .order('slot_date')
            .order('start_time');
        if (query.date)
            dbQuery = dbQuery.eq('slot_date', query.date);
        else if (query.from_date && query.to_date) {
            dbQuery = dbQuery.gte('slot_date', query.from_date).lte('slot_date', query.to_date);
        }
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ slots: data });
    }
}
exports.SlotsService = SlotsService;
exports.slotsService = new SlotsService();
//# sourceMappingURL=slots.service.js.map