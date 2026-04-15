import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';
import { communications, NotificationChannel } from '../../shared/lib/communications';

const log = createLogger('NotificationsService');

export class NotificationsService {

    async list(userId: string, query: { unreadOnly: boolean; limit: number; offset: number }): Promise<ServiceResult<any>> {
        let dbQuery = supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);

        if (query.unreadOnly) {
            dbQuery = dbQuery.eq('is_read', false);
        }

        const { data, error } = await dbQuery;
        if (error) return fail(error.message, 500);

        // Get unread count
        const { count } = await supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        return ok({
            notifications: data,
            unread_count: count || 0,
        });
    }

    /**
     * Internal method to trigger a multi-channel notification
     */
    async notifyUser(userId: string, title: string, body: string, data?: any, channels: NotificationChannel[] = ['push']) {
        return await communications.send({ userId, title, body, data, channels });
    }

    /**
     * Send promotional broadcast from Admin
     */
    async sendBroadcast(input: { title: string; body: string; channels?: NotificationChannel[]; segments?: string[] }): Promise<ServiceResult<any>> {
        log.info('Admin triggered broadcast', input);
        
        await communications.broadcastPromotion({
            title: input.title,
            body: input.body,
            segments: input.segments
        });

        return ok({ message: 'Broadcast initiated successfully' });
    }

    async markAsRead(userId: string, id: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) return fail(error.message, 500);
        return ok({ message: 'Marked as read' });
    }

    async markAllAsRead(userId: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) return fail(error.message, 500);
        return ok({ message: 'All notifications marked as read' });
    }

    async delete(userId: string, id: string): Promise<ServiceResult<any>> {
        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) return fail(error.message, 500);
        return ok({ message: 'Notification deleted' });
    }
}

export const notificationsService = new NotificationsService();
