import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

export const petsRouter = Router();
petsRouter.use(authenticate);

const createPetSchema = z.object({
    name: z.string().min(1),
    type: z.string().optional(),
    breed: z.string().optional(),
    age: z.number().int().min(0).optional(),
    weight: z.number().min(0).optional(),
    medical_notes: z.string().optional(),
    vaccination_status: z.string().optional(),
    image_url: z.string().url().optional(),
});

const updatePetSchema = createPetSchema.partial();

// ─── List User's Pets ───────────────────────────
petsRouter.get('/', async (req: AuthRequest, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', req.user!.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json({ pets: data });
    } catch (err) {
        next(err);
    }
});

// ─── Get Single Pet ─────────────────────────────
petsRouter.get('/:id', async (req: AuthRequest, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id)
            .is('deleted_at', null)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Pet not found' });
        res.json({ pet: data });
    } catch (err) {
        next(err);
    }
});

// ─── Create Pet ─────────────────────────────────
petsRouter.post('/', validate(createPetSchema), async (req: AuthRequest, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .insert({ ...req.body, user_id: req.user!.id })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ pet: data });
    } catch (err) {
        next(err);
    }
});

// ─── Update Pet ─────────────────────────────────
petsRouter.patch('/:id', validate(updatePetSchema), async (req: AuthRequest, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id)
            .select()
            .single();

        if (error || !data) return res.status(404).json({ error: 'Pet not found' });
        res.json({ pet: data });
    } catch (err) {
        next(err);
    }
});

// ─── Soft Delete Pet ────────────────────────────
petsRouter.delete('/:id', async (req: AuthRequest, res, next) => {
    try {
        const { error } = await supabaseAdmin
            .from('pets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user!.id);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Pet removed successfully' });
    } catch (err) {
        next(err);
    }
});
