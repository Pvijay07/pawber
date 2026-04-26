import { z } from 'zod';

export const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(2),
    phone: z.string().optional(),
    role: z.enum(['client', 'provider']).default('client'),
});

export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const updateProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar_url: z.string().optional(),
});

export const refreshTokenSchema = z.object({
    refresh_token: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
