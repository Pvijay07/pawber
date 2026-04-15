import { createLogger } from './logger';
import { supabaseAdmin } from './supabase';

const log = createLogger('CommunicationsService');

export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp';

export interface SendOptions {
    userId: string;
    title: string;
    body: string;
    data?: any;
    channels?: NotificationChannel[];
}

export class CommunicationsService {
    
    async send(options: SendOptions) {
        const { userId, title, body, data, channels = ['push'] } = options;
        log.info('Sending multi-channel notification', { userId, channels });

        const results = await Promise.all(channels.map(channel => this.sendToChannel(channel, options)));
        
        // Always record in-app notification
        await this.recordInAppNotification(userId, title, body, data);

        return results;
    }

    private async sendToChannel(channel: NotificationChannel, options: SendOptions) {
        try {
            switch (channel) {
                case 'push':
                    return await this.sendPush(options);
                case 'email':
                    return await this.sendEmail(options);
                case 'sms':
                    return await this.sendSMS(options);
                case 'whatsapp':
                    return await this.sendWhatsApp(options);
                default:
                    return { success: false, error: 'Invalid channel' };
            }
        } catch (error) {
            log.error(`Failed to send to ${channel}`, { error, userId: options.userId });
            return { success: false, error: (error as Error).message };
        }
    }

    private async sendPush(options: SendOptions) {
        const { userId, title, body, data } = options;
        
        // 1. Get user's push tokens from database
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('push_token')
            .eq('id', userId)
            .single();

        if (!profile?.push_token) {
            log.warn('No push token found for user', { userId });
            return { success: false, error: 'No token' };
        }

        // 2. In a real app, you'd use the Expo SDK here:
        // const expo = new Expo();
        // await expo.sendPushNotificationsAsync([{ to: profile.push_token, title, body, data }]);
        
        log.info('MOCK: Push sent via Expo', { token: profile.push_token, title });
        return { success: true };
    }

    private async sendEmail(options: SendOptions) {
        log.info('MOCK: Email sent via SendGrid/Resend', { userId: options.userId, title: options.title });
        return { success: true };
    }

    private async sendSMS(options: SendOptions) {
        log.info('MOCK: SMS sent via Twilio', { userId: options.userId });
        return { success: true };
    }

    private async sendWhatsApp(options: SendOptions) {
        log.info('MOCK: WhatsApp sent via Twilio/Interakt', { userId: options.userId });
        return { success: true };
    }

    private async recordInAppNotification(userId: string, title: string, message: string, data?: any) {
        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type: data?.type || 'system',
                data: data || {},
                is_read: false
            });
        
        if (error) log.error('Failed to record in-app notification', { error });
    }

    /**
     * Broadcast a promotion to all users
     */
    async broadcastPromotion(options: { title: string, body: string, segments?: string[] }) {
        log.info('Broadcasting promotion', options);
        
        // Implementation: Fetch matching users and loop send()
        const { data: users } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(100); // Batching needed for larger scales

        if (users) {
            for (const user of users) {
                await this.send({
                    userId: user.id,
                    title: options.title,
                    body: options.body,
                    channels: ['push', 'email']
                });
            }
        }
    }
}

export const communications = new CommunicationsService();
