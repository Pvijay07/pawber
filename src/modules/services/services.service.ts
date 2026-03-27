import { supabaseAdmin } from '../../shared/lib';
import { ServiceResult, ok, fail } from '../../shared/types';
import { createLogger } from '../../shared/lib/logger';

const log = createLogger('ServicesService');

export class ServicesService {

    async listCategories(): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) return fail(error.message, 500);
        return ok({ categories: data });
    }

    async listServices(categoryId?: string): Promise<ServiceResult<any>> {
        let query = supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name, icon_url)')
            .eq('is_active', true);

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return fail(error.message, 500);
        return ok({ services: data });
    }

    async getServiceById(serviceId: string): Promise<ServiceResult<any>> {
        const { data: service, error } = await supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name)')
            .eq('id', serviceId)
            .single();

        if (error || !service) return fail('Service not found', 404);

        // Fetch packages
        const { data: packages } = await supabaseAdmin
            .from('service_packages')
            .select('*')
            .eq('service_id', serviceId)
            .order('sort_order');

        // Fetch addons
        const { data: addons } = await supabaseAdmin
            .from('addons')
            .select('*')
            .eq('service_id', serviceId)
            .eq('is_active', true);

        return ok({
            service: {
                ...service,
                packages: packages || [],
                addons: addons || [],
            },
        });
    }

    async createCategory(input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .insert(input)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        log.info('Category created', { id: data.id });
        return ok({ category: data }, 201);
    }

    async createService(input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .insert(input)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        log.info('Service created', { id: data.id });
        return ok({ service: data }, 201);
    }

    async createPackage(serviceId: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('service_packages')
            .insert({ ...input, service_id: serviceId })
            .select()
            .single();

        if (error) return fail(error.message, 500);
        log.info('Package created', { id: data.id, serviceId });
        return ok({ package: data }, 201);
    }

    async createAddon(serviceId: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('addons')
            .insert({ ...input, service_id: serviceId })
            .select()
            .single();

        if (error) return fail(error.message, 500);
        log.info('Addon created', { id: data.id, serviceId });
        return ok({ addon: data }, 201);
    }

    async updateCategory(id: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('service_categories')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ category: data });
    }

    async updateService(id: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('services')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ service: data });
    }

    async updatePackage(id: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('service_packages')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ package: data });
    }

    async updateAddon(id: string, input: any): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('addons')
            .update(input)
            .eq('id', id)
            .select()
            .single();

        if (error) return fail(error.message, 500);
        return ok({ addon: data });
    }

    async deleteItem(table: string, id: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);

        if (error) return fail(error.message, 500);
        return ok({ deleted: true });
    }
}

export const servicesService = new ServicesService();
