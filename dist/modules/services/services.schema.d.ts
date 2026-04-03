import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    icon_url: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    is_active: boolean;
    sort_order?: number | undefined;
    icon_url?: string | undefined;
}, {
    name: string;
    is_active?: boolean | undefined;
    sort_order?: number | undefined;
    icon_url?: string | undefined;
}>;
export declare const createServiceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category_id: z.ZodString;
    image_url: z.ZodOptional<z.ZodString>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    category_id: string;
    name: string;
    is_active: boolean;
    description?: string | undefined;
    image_url?: string | undefined;
}, {
    category_id: string;
    name: string;
    is_active?: boolean | undefined;
    description?: string | undefined;
    image_url?: string | undefined;
}>;
export declare const createPackageSchema: z.ZodObject<{
    package_name: z.ZodString;
    price: z.ZodNumber;
    duration_minutes: z.ZodOptional<z.ZodNumber>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sort_order: z.ZodOptional<z.ZodNumber>;
    is_instant_available: z.ZodDefault<z.ZodBoolean>;
    is_scheduled_available: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    package_name: string;
    price: number;
    is_instant_available: boolean;
    is_scheduled_available: boolean;
    sort_order?: number | undefined;
    duration_minutes?: number | undefined;
    features?: string[] | undefined;
}, {
    package_name: string;
    price: number;
    sort_order?: number | undefined;
    duration_minutes?: number | undefined;
    features?: string[] | undefined;
    is_instant_available?: boolean | undefined;
    is_scheduled_available?: boolean | undefined;
}>;
export declare const createAddonSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    duration_minutes: z.ZodOptional<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    is_active: boolean;
    price: number;
    duration_minutes?: number | undefined;
}, {
    name: string;
    price: number;
    is_active?: boolean | undefined;
    duration_minutes?: number | undefined;
}>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateAddonInput = z.infer<typeof createAddonSchema>;
//# sourceMappingURL=services.schema.d.ts.map