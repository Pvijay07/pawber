"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
exports.petsRouter = (0, express_1.Router)();
exports.petsRouter.use(auth_middleware_1.authenticate);
const createPetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().optional(),
    breed: zod_1.z.string().optional(),
    age: zod_1.z.number().int().min(0).optional(),
    weight: zod_1.z.number().min(0).optional(),
    medical_notes: zod_1.z.string().optional(),
    vaccination_status: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional(),
});
const updatePetSchema = createPetSchema.partial();
// ─── List User's Pets ───────────────────────────
exports.petsRouter.get('/', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', req.user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ pets: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Get Single Pet ─────────────────────────────
exports.petsRouter.get('/:id', async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('pets')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .is('deleted_at', null)
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Pet not found' });
        res.json({ pet: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Create Pet ─────────────────────────────────
exports.petsRouter.post('/', (0, validate_middleware_1.validate)(createPetSchema), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('pets')
            .insert({ ...req.body, user_id: req.user.id })
            .select()
            .single();
        if (error)
            return res.status(500).json({ error: error.message });
        res.status(201).json({ pet: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Update Pet ─────────────────────────────────
exports.petsRouter.patch('/:id', (0, validate_middleware_1.validate)(updatePetSchema), async (req, res, next) => {
    try {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('pets')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error || !data)
            return res.status(404).json({ error: 'Pet not found' });
        res.json({ pet: data });
    }
    catch (err) {
        next(err);
    }
});
// ─── Soft Delete Pet ────────────────────────────
exports.petsRouter.delete('/:id', async (req, res, next) => {
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('pets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);
        if (error)
            return res.status(500).json({ error: error.message });
        res.json({ message: 'Pet removed successfully' });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=pets.routes.js.map