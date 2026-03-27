import { ServiceResult } from '../../shared/types';
import { RegisterProviderInput, UpdateProviderInput, UploadDocInput, AddServiceInput, BlockedDateInput, BidInput } from './providers.schema';
export declare class ProvidersService {
    list(query: {
        category?: string;
        city?: string;
        limit: number;
        offset: number;
    }): Promise<ServiceResult<any>>;
    getById(id: string): Promise<ServiceResult<any>>;
    register(userId: string, input: RegisterProviderInput): Promise<ServiceResult<any>>;
    updateMe(userId: string, input: UpdateProviderInput): Promise<ServiceResult<any>>;
    uploadDocument(userId: string, input: UploadDocInput): Promise<ServiceResult<any>>;
    getMyBookings(userId: string, status?: string): Promise<ServiceResult<any>>;
    addService(userId: string, input: AddServiceInput): Promise<ServiceResult<any>>;
    getServicesByProvider(providerId: string): Promise<ServiceResult<any>>;
    getBookingsByProvider(providerId: string, status?: string): Promise<ServiceResult<any>>;
    getBids(providerId: string): Promise<ServiceResult<any>>;
    createBid(providerId: string, input: BidInput): Promise<ServiceResult<any>>;
    listBlockedDates(providerId: string): Promise<ServiceResult<any>>;
    addBlockedDate(providerId: string, input: BlockedDateInput): Promise<ServiceResult<any>>;
    removeBlockedDate(id: string): Promise<ServiceResult<any>>;
    getPerformance(providerId: string): Promise<ServiceResult<any>>;
    getWalletSummary(providerId: string): Promise<ServiceResult<any>>;
    getTransactionsByProvider(providerId: string, query: {
        type?: string;
        limit: number;
        offset: number;
    }): Promise<ServiceResult<any>>;
    getEventsByProvider(providerId: string): Promise<ServiceResult<any>>;
    getMyProfile(userId: string): Promise<ServiceResult<any>>;
}
export declare const providersService: ProvidersService;
//# sourceMappingURL=providers.service.d.ts.map