import { ServiceResult } from '../../shared/types';
import { CreateSlotsInput } from './slots.schema';
export declare class SlotsService {
    getByProvider(providerId: string, query: {
        date?: string;
        from_date?: string;
        to_date?: string;
    }): Promise<ServiceResult<any>>;
    lockSlot(userId: string, slotId: string): Promise<ServiceResult<any>>;
    releaseLock(userId: string, slotId: string): Promise<ServiceResult<any>>;
    bulkCreate(userId: string, input: CreateSlotsInput): Promise<ServiceResult<any>>;
    toggleBlock(userId: string, id: string): Promise<ServiceResult<any>>;
    getMySlots(userId: string, query: {
        date?: string;
        from_date?: string;
        to_date?: string;
    }): Promise<ServiceResult<any>>;
}
export declare const slotsService: SlotsService;
//# sourceMappingURL=slots.service.d.ts.map