"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('AuthService');
class AuthService {
    async signUp(input) {
        const { email, password, full_name, phone, role } = input;
        try {
            log.info('Attempting to create user in Supabase:', { email });
            // Create auth user
            const { data: authData, error: authError } = await lib_1.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });
            if (authError) {
                log.error('Supabase createUser error:', authError);
                return (0, types_1.fail)(authError.message, 400);
            }
            // Create profile
            const { error: profileError } = await lib_1.supabaseAdmin
                .from('profiles')
                .insert({ id: authData.user.id, role, full_name, phone });
            if (profileError) {
                log.error('Supabase profile creation error:', profileError);
                // Rollback: delete auth user if profile creation fails
                await lib_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return (0, types_1.fail)('Failed to create profile', 500);
            }
            // Sign in to get tokens
            const { data: session, error: signInError } = await lib_1.supabaseAdmin.auth.signInWithPassword({ email, password });
            if (signInError) {
                log.error('Supabase sign in error after creation:', signInError);
                return (0, types_1.fail)('Account created but sign-in failed. Please sign in manually.', 500);
            }
            log.info('User signed up successfully', { userId: authData.user.id, email });
            return (0, types_1.ok)({
                message: 'Account created successfully',
                user: { id: authData.user.id, email, role, full_name },
                session: {
                    access_token: session.session?.access_token,
                    refresh_token: session.session?.refresh_token,
                    expires_at: session.session?.expires_at,
                },
            }, 201);
        }
        catch (error) {
            log.error('💥 Exception during signUp:', {
                message: error?.message,
                stack: error?.stack,
                cause: error?.cause,
                name: error?.name,
                url: process.env.SUPABASE_URL // log the url to see if it's malformed
            });
            return (0, types_1.fail)(`Sign up failed due to an internal error: ${error?.message || 'Unknown error'}`, 500);
        }
    }
    async signIn(input) {
        const { email, password } = input;
        const { data, error } = await lib_1.supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error)
            return (0, types_1.fail)('Invalid email or password', 401);
        // Fetch profile
        const { data: profile } = await lib_1.supabaseAdmin
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', data.user.id)
            .single();
        return (0, types_1.ok)({
            user: {
                id: data.user.id,
                email: data.user.email,
                role: profile?.role || 'client',
                full_name: profile?.full_name,
                avatar_url: profile?.avatar_url,
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        });
    }
    async getProfile(userId) {
        const { data: profile, error } = await lib_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error)
            return (0, types_1.fail)('Profile not found', 404);
        return (0, types_1.ok)({ user: profile });
    }
    async updateProfile(userId, input) {
        const { data, error } = await lib_1.supabaseAdmin
            .from('profiles')
            .update(input)
            .eq('id', userId)
            .select()
            .single();
        if (error)
            return (0, types_1.fail)('Failed to update profile', 500);
        return (0, types_1.ok)({ user: data });
    }
    async refreshToken(refreshToken) {
        const { data, error } = await lib_1.supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
        if (error)
            return (0, types_1.fail)('Invalid refresh token', 401);
        return (0, types_1.ok)({
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at,
            },
        });
    }
    async signOut(accessToken) {
        await lib_1.supabaseAdmin.auth.admin.signOut(accessToken);
        return (0, types_1.ok)({ message: 'Signed out successfully' });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map