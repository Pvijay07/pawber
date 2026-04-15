import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { SignUpInput, SignInInput, UpdateProfileInput } from './auth.schema';

const log = createLogger('AuthService');

export class AuthService {

    async signUp(input: SignUpInput): Promise<ServiceResult<any>> {
        const { email, password, full_name, phone, role } = input;

        try {
            log.info('Attempting to create user in Supabase:', { email });
            // Create auth user
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (authError) {
                log.error('Supabase createUser error:', authError);
                return fail(authError.message, 400);
            }

            // Create profile with referral code
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({ 
                    id: authData.user.id, 
                    role, 
                    full_name, 
                    phone,
                    referral_code: await this.generateUniqueReferralCode()
                });

            if (profileError) {
                log.error('Supabase profile creation error:', profileError);
                // Rollback: delete auth user if profile creation fails
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return fail('Failed to create profile', 500);
            }

            // Sign in to get tokens
            const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });

            if (signInError) {
                log.error('Supabase sign in error after creation:', signInError);
                return fail('Account created but sign-in failed. Please sign in manually.', 500);
            }

            log.info('User signed up successfully', { userId: authData.user.id, email });

            return ok({
                message: 'Account created successfully',
                user: { id: authData.user.id, email, role, full_name },
                session: {
                    access_token: session.session?.access_token,
                    refresh_token: session.session?.refresh_token,
                    expires_at: session.session?.expires_at,
                },
            }, 201);
        } catch (error: any) {
            log.error('💥 Exception during signUp:', {
                message: error?.message,
                stack: error?.stack,
                cause: error?.cause,
                name: error?.name,
                url: process.env.SUPABASE_URL // log the url to see if it's malformed
            });
            return fail(`Sign up failed due to an internal error: ${error?.message || 'Unknown error'}`, 500);
        }
    }

    async signIn(input: SignInInput): Promise<ServiceResult<any>> {
        const { email, password } = input;

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) return fail('Invalid email or password', 401);

        // Fetch profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', data.user.id)
            .single();

        return ok({
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

    async getProfile(userId: string): Promise<ServiceResult<any>> {
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return fail('Profile not found', 404);
        return ok({ user: profile });
    }

    async updateProfile(userId: string, input: UpdateProfileInput): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(input)
            .eq('id', userId)
            .select()
            .single();

        if (error) return fail('Failed to update profile', 500);
        return ok({ user: data });
    }

    async refreshToken(refreshToken: string): Promise<ServiceResult<any>> {
        const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });
        if (error) return fail('Invalid refresh token', 401);

        return ok({
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_at: data.session?.expires_at,
            },
        });
    }

    async signOut(accessToken: string): Promise<ServiceResult<any>> {
        await supabaseAdmin.auth.admin.signOut(accessToken);
        return ok({ message: 'Signed out successfully' });
    }

    private async generateUniqueReferralCode(): Promise<string> {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let isUnique = false;
        let code = '';

        while (!isUnique) {
            code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('referral_code', code)
                .single();

            if (!data) isUnique = true;
        }

        return code;
    }
}

export const authService = new AuthService();
