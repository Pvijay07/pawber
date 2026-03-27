import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    icon_url: z.string().url().optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().default(true),
});

export const createServiceSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    category_id: z.string().uuid(),
    image_url: z.string().url().optional(),
    is_active: z.boolean().default(true),
});

export const createPackageSchema = z.object({
    package_name: z.string().min(1).max(100),
    price: z.number().min(0),
    duration_minutes: z.number().int().optional(),
    features: z.array(z.string()).optional(),
    sort_order: z.number().int().optional(),
    is_instant_available: z.boolean().default(true),
    is_scheduled_available: z.boolean().default(true),
});

export const createAddonSchema = z.object({
    name: z.string().min(1).max(100),
    price: z.number().min(0),
    duration_minutes: z.number().int().optional(),
    is_active: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateAddonInput = z.infer<typeof createAddonSchema>;
