"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesService = exports.ServicesService = void 0;
const lib_1 = require("../../shared/lib");
const types_1 = require("../../shared/types");
const logger_1 = require("../../shared/lib/logger");
const log = (0, logger_1.createLogger)('ServicesService');
class ServicesService {
    async listCategories() {
        const { data, error } = await lib_1.supabaseAdmin
            .from('service_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ categories: data });
    }
    async listServices(categoryId) {
        let query = lib_1.supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name, icon_url)')
            .eq('is_active', true);
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ services: data });
    }
    async getServiceById(serviceId) {
        const { data: service, error } = await lib_1.supabaseAdmin
            .from('services')
            .select('*, category:service_categories(id, name)')
            .eq('id', serviceId)
            .single();
        if (error || !service)
            return (0, types_1.fail)('Service not found', 404);
        // Fetch packages
        const { data: packages } = await lib_1.supabaseAdmin
            .from('service_packages')
            .select('*')
            .eq('service_id', serviceId)
            .order('sort_order');
        // Fetch addons
        const { data: addons } = await lib_1.supabaseAdmin
            .from('addons')
            .select('*')
            .eq('service_id', serviceId)
            .eq('is_active', true);
        return (0, types_1.ok)({
            service: {
                ...service,
                packages: packages || [],
                addons: addons || [],
            },
        });
    }
    async createCategory(input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('service_categories')
            .insert(input)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        log.info('Category created', { id: data.id });
        return (0, types_1.ok)({ category: data }, 201);
    }
    async createService(input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('services')
            .insert(input)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        log.info('Service created', { id: data.id });
        return (0, types_1.ok)({ service: data }, 201);
    }
    async createPackage(serviceId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('service_packages')
            .insert({ ...input, service_id: serviceId })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        log.info('Package created', { id: data.id, serviceId });
        return (0, types_1.ok)({ package: data }, 201);
    }
    async createAddon(serviceId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('addons')
            .insert({ ...input, service_id: serviceId })
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        log.info('Addon created', { id: data.id, serviceId });
        return (0, types_1.ok)({ addon: data }, 201);
    }
    async updateCategory(id, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('service_categories')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ category: data });
    }
    async updateService(id, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('services')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ service: data });
    }
    async updatePackage(id, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('service_packages')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ package: data });
    }
    async updateAddon(id, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('addons')
            .update(input)
            .eq('id', id)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ addon: data });
    }
    async deleteItem(table, id) {
        const { error } = await lib_1.supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ deleted: true });
    }
}
exports.ServicesService = ServicesService;
exports.servicesService = new ServicesService();
//# sourceMappingURL=services.service.js.map