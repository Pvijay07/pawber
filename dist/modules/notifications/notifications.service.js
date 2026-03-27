"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = exports.NotificationsService = void 0;
const lib_1 = require("../../shared/lib");
const logger_1 = require("../../shared/lib/logger");
const types_1 = require("../../shared/types");
const log = (0, logger_1.createLogger)('NotificationsService');
class NotificationsService {
    async list(userId, query) {
        let dbQuery = lib_1.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(query.offset, query.offset + query.limit - 1);
        if (query.unreadOnly) {
            dbQuery = dbQuery.eq('is_read', false);
        }
        const { data, error } = await dbQuery;
        if (error)
            return (0, types_1.fail)(error.message, 500);
        // Get unread count
        const { count } = await lib_1.supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        return (0, types_1.ok)({
            notifications: data,
            unread_count: count || 0,
        });
    }
    async markAsRead(userId, id) {
        const { error } = await lib_1.supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ message: 'Marked as read' });
    }
    async markAllAsRead(userId) {
        const { error } = await lib_1.supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ message: 'All notifications marked as read' });
    }
    async delete(userId, id) {
        const { error } = await lib_1.supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            return (0, types_1.fail)(error.message, 500);
        return (0, types_1.ok)({ message: 'Notification deleted' });
    }
}
exports.NotificationsService = NotificationsService;
exports.notificationsService = new NotificationsService();
//# sourceMappingURL=notifications.service.js.map