import { ServiceResult } from '../../shared/types';
export declare class NotificationsService {
    list(userId: string, query: {
        unreadOnly: boolean;
        limit: number;
        offset: number;
    }): Promise<ServiceResult<any>>;
    markAsRead(userId: string, id: string): Promise<ServiceResult<any>>;
    markAllAsRead(userId: string): Promise<ServiceResult<any>>;
    delete(userId: string, id: string): Promise<ServiceResult<any>>;
}
export declare const notificationsService: NotificationsService;
//# sourceMappingURL=notifications.service.d.ts.map