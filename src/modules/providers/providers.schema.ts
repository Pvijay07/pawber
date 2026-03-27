import { z } from 'zod';

export const registerProviderSchema = z.object({
    business_name: z.string().min(2),
    category: z.string(),
    description: z.string().optional(),
    address: z.string(),
    city: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    service_radius_km: z.number().int().min(1).max(100).optional(),
});

export const updateProviderSchema = z.object({
    business_name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    service_radius_km: z.number().int().min(1).max(100).optional(),
    is_online: z.boolean().optional(),
});

export const uploadDocSchema = z.object({
    document_type: z.string(),
    file_url: z.string().url(),
});

export const addServiceSchema = z.object({
    service_id: z.string().uuid(),
    base_price: z.number().min(0),
});

export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type UploadDocInput = z.infer<typeof uploadDocSchema>;
export type AddServiceInput = z.infer<typeof addServiceSchema>;

// Additional schemas for provider-specific features
export const blockedDateSchema = z.object({
    date: z.string().refine((s) => !isNaN(Date.parse(s)), {
        message: 'Invalid date string',
    }),
    reason: z.string().optional(),
});
export type BlockedDateInput = z.infer<typeof blockedDateSchema>;

export const bidSchema = z.object({
    request_id: z.string().uuid(),
    amount: z.number().min(0),
    message: z.string().optional(),
    eta: z.string().optional(),
});
export type BidInput = z.infer<typeof bidSchema>;
