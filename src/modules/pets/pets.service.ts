import { supabaseAdmin } from '../../shared/lib';
import { ServiceResult, ok, fail } from '../../shared/types';
import { CreatePetInput, UpdatePetInput } from './pets.schema';

export class PetsService {
    async list(userId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) return fail(error.message, 500);
        return ok({ pets: data });
    }

    async getById(userId: string, petId: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .select('*')
            .eq('id', petId)
            .eq('user_id', userId)
            .is('deleted_at', null)
            .single();

        if (error || !data) return fail('Pet not found', 404);
        return ok({ pet: data });
    }

    async create(userId: string, input: CreatePetInput): Promise<ServiceResult<any>> {
        try {
            const { data, error } = await supabaseAdmin
                .from('pets')
                .insert({ ...input, user_id: userId })
                .select()
                .single();

            if (error) {
                console.error('[PETS SERVICE] Insert error:', error);
                return fail(error.message, 400);
            }
            return ok({ pet: data }, 201);
        } catch (err: any) {
            console.error('[PETS SERVICE] Critical crash:', err);
            return fail(err.message || 'Failed to store pet in database', 500);
        }
    }

    async update(userId: string, petId: string, input: UpdatePetInput): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('pets')
            .update(input)
            .eq('id', petId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !data) return fail('Pet not found', 404);
        return ok({ pet: data });
    }

    async softDelete(userId: string, petId: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from('pets')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', petId)
            .eq('user_id', userId);

        if (error) return fail(error.message, 500);
        return ok({ message: 'Pet removed successfully' });
    }
}

export const petsService = new PetsService();
