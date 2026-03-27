import { ServiceResult } from '../../shared/types';
export declare class EventsService {
    list(query: {
        upcoming_only: boolean;
        limit: number;
        offset: number;
    }): Promise<ServiceResult<any>>;
    getById(id: string): Promise<ServiceResult<any>>;
    purchaseTicket(userId: string, eventId: string): Promise<ServiceResult<any>>;
    getMyTickets(userId: string): Promise<ServiceResult<any>>;
    validateTicket(qrCode: string): Promise<ServiceResult<any>>;
}
export declare const eventsService: EventsService;
//# sourceMappingURL=events.service.d.ts.map