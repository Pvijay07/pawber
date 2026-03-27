"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petsService = exports.PetsService = void 0;
const lib_1 = require("../../shared/lib");
const types_1 = require("../../shared/types");
class PetsService {
    async list(userId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ pets: data });
    }
    async getById(userId, petId) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('pets')
            .select('*')
            .eq('id', petId)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();
        if (error || !data)
            return (0, types_1.fail)('Pet not found', 404);
        return (0, types_1.ok)({ pet: data });
    }
    async create(userId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('pets')
            .insert({ ...input, user_id: userId })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ pet: data }, 201);
    }
    async update(userId, petId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('pets')
            .update(input)
            .eq('id', petId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !data)
            return (0, types_1.fail)('Pet not found', 404);
        return (0, types_1.ok)({ pet: data });
    }
    async softDelete(userId, petId) {
        const { error } = await lib_1.supabaseAdmin
            .from('pets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', petId)
            .eq('user_id', userId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ message: 'Pet removed successfully' });
    }
}
exports.PetsService = PetsService;
exports.petsService = new PetsService();
//# sourceMappingURL=pets.service.js.map