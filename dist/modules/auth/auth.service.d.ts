import { ServiceResult } from '../../shared/types';
import { SignUpInput, SignInInput, UpdateProfileInput } from './auth.schema';
export declare class AuthService {
    signUp(input: SignUpInput): Promise<ServiceResult<any>>;
    signIn(input: SignInInput): Promise<ServiceResult<any>>;
    getProfile(userId: string): Promise<ServiceResult<any>>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<ServiceResult<any>>;
    refreshToken(refreshToken: string): Promise<ServiceResult<any>>;
    signOut(accessToken: string): Promise<ServiceResult<any>>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map