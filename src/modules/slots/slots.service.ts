import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { CreateSlotsInput } from './slots.schema';

const log = createLogger('SlotsService');

export class SlotsService {

    async getByProvider(providerId: string, query: { date?: string; from_date?: string; to_date?: string }): Promise<ServiceResult<any>> {
        let dbQuery = supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', providerId)
            .eq('is_blocked', false)
            .order('slot_date')
            .order('start_time');

        if (query.date) {
            dbQuery = dbQuery.eq('slot_date', query.date);
        } else if (query.from_date && query.to_date) {
            dbQuery = dbQuery.gte('slot_date', query.from_date).lte('slot_date', query.to_date);
        } else {
            const today = new Date().toISOString().split('T')[0];
            const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            dbQuery = dbQuery.gte('slot_date', today).lte('slot_date', week);
        }

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);

        const availableSlots = (data || []).map((slot: any) => ({
            ...slot,
            is_available: slot.booked_count < slot.capacity,
        }));

        // Cleanup expired locks
        await supabaseAdmin
            .from('slot_locks')
            .delete()
            .lt('lock_expires_at', new Date().toISOString());

        return ok({ slots: availableSlots });
    }

    async lockSlot(userId: string, slotId: string): Promise<ServiceResult<any>> {
        const { data: slot } = await supabaseAdmin
            .from('provider_slots')
            .select('capacity, booked_count, is_blocked')
            .eq('id', slotId)
            .single();

        if (!slot) return fail('Slot not found', 404);
        if (slot.is_blocked) return fail('Slot is blocked', 400);
        if (slot.booked_count >= slot.capacity) return fail('Slot is fully booked', 409);

        const { data: existingLocks } = await supabaseAdmin
            .from('slot_locks')
            .select('id, user_id')
            .eq('slot_id', slotId)
            .gt('lock_expires_at', new Date().toISOString());

        const totalReserved = slot.booked_count + (existingLocks?.length || 0);
        if (totalReserved >= slot.capacity) {
            return fail('Slot is currently being booked by someone else. Try again shortly.', 409);
        }

        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);
        const { data: lock, error } = await supabaseAdmin
            .from('slot_locks')
            .insert({
                slot_id: slotId,
                user_id: userId,
                lock_expires_at: lockExpiry.toISOString(),
            })
            .select()
            .single();

        if (error) return fail('Failed to lock slot', 500);

        return ok({
            lock,
            expires_at: lockExpiry.toISOString(),
            expires_in_seconds: 300,
            message: 'Slot locked for 5 minutes. Complete your booking before it expires.',
        });
    }

    async releaseLock(userId: string, slotId: string): Promise<ServiceResult<any>> {
        await supabaseAdmin
            .from('slot_locks')
            .delete()
            .eq('slot_id', slotId)
            .eq('user_id', userId);

        return ok({ message: 'Lock released' });
    }

    async bulkCreate(userId: string, input: CreateSlotsInput): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return fail('Provider not found', 404);

        const slotsToInsert = input.slots.map(s => ({
            ...s,
            provider_id: provider.id,
        }));

        const { data, error } = await supabaseAdmin
            .from('provider_slots')
            .insert(slotsToInsert)
            .select();

        if (error) return fail('Failed to create slots', 500);
        return ok({ slots: data, count: data.length });
    }

    async toggleBlock(userId: string, id: string): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return fail('Provider not found', 404);

        const { data: slot } = await supabaseAdmin
            .from('provider_slots')
            .select('is_blocked')
            .eq('id', id)
            .eq('provider_id', provider.id)
            .single();

        if (!slot) return fail('Slot not found', 404);

        const { data, error } = await supabaseAdmin
            .from('provider_slots')
            .update({ is_blocked: !slot.is_blocked })
            .eq('id', id)
            .select()
            .single();

        if (error) return fail('Failed to update slot', 500);
        return ok({ slot: data });
    }

    async getMySlots(userId: string, query: { date?: string; from_date?: string; to_date?: string }): Promise<ServiceResult<any>> {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!provider) return ok({ slots: [] });

        let dbQuery = supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', provider.id)
            .order('slot_date')
            .order('start_time');

        if (query.date) dbQuery = dbQuery.eq('slot_date', query.date);
        else if (query.from_date && query.to_date) {
            dbQuery = dbQuery.gte('slot_date', query.from_date).lte('slot_date', query.to_date);
        }

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);
        return ok({ slots: data });
    }
}

export const slotsService = new SlotsService();
