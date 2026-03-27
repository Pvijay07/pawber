import { z } from 'zod';
export declare const registerProviderSchema: z.ZodObject<{
    business_name: z.ZodString;
    category: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    city: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    service_radius_km: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    address: string;
    business_name: string;
    category: string;
    city: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
    description?: string | undefined;
    service_radius_km?: number | undefined;
}, {
    address: string;
    business_name: string;
    category: string;
    city: string;
    latitude?: number | undefined;
    longitude?: number | undefined;
    description?: string | undefined;
    service_radius_km?: number | undefined;
}>;
export declare const updateProviderSchema: z.ZodObject<{
    business_name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    service_radius_km: z.ZodOptional<z.ZodNumber>;
    is_online: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    description?: string | undefined;
    business_name?: string | undefined;
    city?: string | undefined;
    service_radius_km?: number | undefined;
    is_online?: boolean | undefined;
}, {
    address?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    description?: string | undefined;
    business_name?: string | undefined;
    city?: string | undefined;
    service_radius_km?: number | undefined;
    is_online?: boolean | undefined;
}>;
export declare const uploadDocSchema: z.ZodObject<{
    document_type: z.ZodString;
    file_url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    document_type: string;
    file_url: string;
}, {
    document_type: string;
    file_url: string;
}>;
export declare const addServiceSchema: z.ZodObject<{
    service_id: z.ZodString;
    base_price: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    service_id: string;
    base_price: number;
}, {
    service_id: string;
    base_price: number;
}>;
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type UploadDocInput = z.infer<typeof uploadDocSchema>;
export type AddServiceInput = z.infer<typeof addServiceSchema>;
export declare const blockedDateSchema: z.ZodObject<{
    date: z.ZodEffects<z.ZodString, string, string>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date: string;
    reason?: string | undefined;
}, {
    date: string;
    reason?: string | undefined;
}>;
export type BlockedDateInput = z.infer<typeof blockedDateSchema>;
export declare const bidSchema: z.ZodObject<{
    request_id: z.ZodString;
    amount: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
    eta: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    request_id: string;
    message?: string | undefined;
    eta?: string | undefined;
}, {
    amount: number;
    request_id: string;
    message?: string | undefined;
    eta?: string | undefined;
}>;
export type BidInput = z.infer<typeof bidSchema>;
//# sourceMappingURL=providers.schema.d.ts.map