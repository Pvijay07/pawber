import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';

export const slotsRouter = Router();

// ─── Get Available Slots for Provider (Public) ──
slotsRouter.get('/provider/:providerId', async (req, res, next) => {
    try {
        const { date, from_date, to_date } = req.query;

        let query = supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', req.params.providerId)
            .eq('is_blocked', false)
            .order('slot_date')
            .order('start_time');

        if (date) {
            query = query.eq('slot_date', date as string);
        } else if (from_date && to_date) {
            query = query.gte('slot_date', from_date as string).lte('slot_date', to_date as string);
        } else {
            // Default: next 7 days
            const today = new Date().toISOString().split('T')[0];
            const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            query = query.gte('slot_date', today).lte('slot_date', week);
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });

        // Filter out fully booked slots and remove locked slots
        const now = new Date();
        const availableSlots = (data || []).map((slot: any) => ({
            ...slot,
            is_available: slot.booked_count < slot.capacity,
        }));

        // Clean up expired locks
        await supabaseAdmin
            .from('slot_locks')
            .delete()
            .lt('lock_expires_at', now.toISOString());

        res.json({ slots: availableSlots });
    } catch (err) {
        next(err);
    }
});

// ─── Lock a Slot (for booking flow) ─────────────
slotsRouter.post('/:slotId/lock', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const slotId = req.params.slotId;

        // Check slot availability
        const { data: slot } = await supabaseAdmin
            .from('provider_slots')
            .select('capacity, booked_count, is_blocked')
            .eq('id', slotId)
            .single();

        if (!slot) throw new AppError('Slot not found', 404);
        if (slot.is_blocked) throw new AppError('Slot is blocked', 400);
        if (slot.booked_count >= slot.capacity) throw new AppError('Slot is fully booked', 409);

        // Check for existing active locks (excluding expired ones)
        const { data: existingLocks } = await supabaseAdmin
            .from('slot_locks')
            .select('id, user_id')
            .eq('slot_id', slotId)
            .gt('lock_expires_at', new Date().toISOString());

        // Count total: booked + active locks
        const totalReserved = slot.booked_count + (existingLocks?.length || 0);
        if (totalReserved >= slot.capacity) {
            throw new AppError('Slot is currently being booked by someone else. Try again shortly.', 409);
        }

        // Create lock (5 minute expiry)
        const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);

        const { data: lock, error } = await supabaseAdmin
            .from('slot_locks')
            .insert({
                slot_id: slotId,
                user_id: req.user!.id,
                lock_expires_at: lockExpiry.toISOString(),
            })
            .select()
            .single();

        if (error) throw new AppError('Failed to lock slot', 500);

        res.json({
            lock,
            expires_at: lockExpiry.toISOString(),
            expires_in_seconds: 300,
            message: 'Slot locked for 5 minutes. Complete your booking before it expires.',
        });
    } catch (err) {
        next(err);
    }
});

// ─── Release a Slot Lock ────────────────────────
slotsRouter.delete('/:slotId/lock', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await supabaseAdmin
            .from('slot_locks')
            .delete()
            .eq('slot_id', req.params.slotId)
            .eq('user_id', req.user!.id);

        res.json({ message: 'Lock released' });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Create Slots ─────────────────────
const createSlotsSchema = z.object({
    slots: z.array(z.object({
        slot_date: z.string(), // YYYY-MM-DD
        start_time: z.string(), // HH:MM
        end_time: z.string(),   // HH:MM
        capacity: z.number().int().min(1).default(1),
    })).min(1),
});

slotsRouter.post('/bulk', authenticate, authorize('provider'), validate(createSlotsSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) throw new AppError('Provider not found', 404);

        const slotsToInsert = req.body.slots.map((s: any) => ({
            ...s,
            provider_id: provider.id,
        }));

        const { data, error } = await supabaseAdmin
            .from('provider_slots')
            .insert(slotsToInsert)
            .select();

        if (error) throw new AppError('Failed to create slots', 500);
        res.status(201).json({ slots: data, count: data.length });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Block/Unblock Slot ───────────────
slotsRouter.patch('/:id/block', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) throw new AppError('Provider not found', 404);

        const { data: slot } = await supabaseAdmin
            .from('provider_slots')
            .select('is_blocked')
            .eq('id', req.params.id)
            .eq('provider_id', provider.id)
            .single();

        if (!slot) throw new AppError('Slot not found', 404);

        const { data, error } = await supabaseAdmin
            .from('provider_slots')
            .update({ is_blocked: !slot.is_blocked })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw new AppError('Failed to update slot', 500);
        res.json({ slot: data });
    } catch (err) {
        next(err);
    }
});

// ─── Provider: Get My Slots ─────────────────────
slotsRouter.get('/me', authenticate, authorize('provider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { data: provider } = await supabaseAdmin
            .from('providers')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!provider) return res.json({ slots: [] });

        const { date, from_date, to_date } = req.query;

        let query = supabaseAdmin
            .from('provider_slots')
            .select('*')
            .eq('provider_id', provider.id)
            .order('slot_date')
            .order('start_time');

        if (date) query = query.eq('slot_date', date as string);
        else if (from_date && to_date) {
            query = query.gte('slot_date', from_date as string).lte('slot_date', to_date as string);
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json({ slots: data });
    } catch (err) {
        next(err);
    }
});
