import { z } from 'zod';
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    full_name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["client", "provider"]>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    role: "client" | "provider";
    full_name: string;
    phone?: string | undefined;
}, {
    password: string;
    email: string;
    full_name: string;
    role?: "client" | "provider" | undefined;
    phone?: string | undefined;
}>;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatar_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    full_name?: string | undefined;
    phone?: string | undefined;
    avatar_url?: string | undefined;
}, {
    full_name?: string | undefined;
    phone?: string | undefined;
    avatar_url?: string | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refresh_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refresh_token: string;
}, {
    refresh_token: string;
}>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
//# sourceMappingURL=auth.schema.d.ts.map