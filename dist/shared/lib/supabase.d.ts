/**
 * Actual implementation of Supabase client if configured,
 * otherwise fallback to shim.
 */
declare let supabaseAdmin: any;
export declare const supabasePublic: any;
export { supabaseAdmin };
export declare function createSupabaseClient(token: string): any;
export declare function isSupabaseConfigured(): boolean;
//# sourceMappingURL=supabase.d.ts.map