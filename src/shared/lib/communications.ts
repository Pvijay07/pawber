import { createLogger } from './logger';
import { supabaseAdmin } from './supabase';
import { env } from '../../config';
import { Expo } from 'expo-server-sdk';
import { Twilio } from 'twilio';
import { Resend } from 'resend';

const log = createLogger('CommunicationsService');

// Initialize clients (only once)
const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });
const twilio = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN 
    ? new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN) 
    : null;
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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
        
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('push_token')
            .eq('id', userId)
            .single();

        if (!profile?.push_token) {
            log.warn('No push token found for user', { userId });
            return { success: false, error: 'No token' };
        }

        if (!Expo.isExpoPushToken(profile.push_token)) {
            log.error('Invalid push token', { token: profile.push_token });
            return { success: false, error: 'Invalid token' };
        }

        try {
            const messages = [{
                to: profile.push_token,
                sound: 'default' as const,
                title,
                body,
                data: data || {},
            }];
            
            // In dev without token, log only. In prod with token, send real.
            if (!env.EXPO_ACCESS_TOKEN && env.NODE_ENV === 'development') {
                log.info('MOCK: Push sent via Expo (Token present, but EXPO_ACCESS_TOKEN missing)', { title });
                return { success: true };
            }

            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                await expo.sendPushNotificationsAsync(chunk);
            }
            
            log.info('Push notification sent successfully', { userId });
            return { success: true };
        } catch (error) {
            log.error('Expo push error', { error });
            return { success: false, error: 'Expo service failed' };
        }
    }

    private async sendEmail(options: SendOptions) {
        const { userId, title, body } = options;

        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!user || !user.user?.email) {
            log.warn('User email not found', { userId });
            return { success: false, error: 'No email found' };
        }

        if (!resend) {
            log.info('MOCK: Email logic bypassed (RESEND_API_KEY missing)', { title, email: user.user.email });
            return { success: true };
        }

        try {
            await resend.emails.send({
                from: env.FROM_EMAIL,
                to: user.user.email,
                subject: title,
                text: body,
                // html: `<p>${body}</p>` // In future, use templates
            });
            log.info('Email sent successfully', { email: user.user.email });
            return { success: true };
        } catch (error) {
            log.error('Resend email error', { error });
            return { success: false, error: 'Email service failed' };
        }
    }

    private async sendSMS(options: SendOptions) {
        const { userId, body } = options;

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('phone')
            .eq('id', userId)
            .single();

        if (!profile?.phone) {
            log.warn('User phone not found', { userId });
            return { success: false, error: 'No phone found' };
        }

        if (!twilio) {
            log.info('MOCK: SMS logic bypassed (TWILIO keys missing)', { phone: profile.phone });
            return { success: true };
        }

        try {
            await twilio.messages.create({
                body,
                from: env.TWILIO_PHONE_NUMBER,
                to: profile.phone,
            });
            log.info('SMS sent successfully', { phone: profile.phone });
            return { success: true };
        } catch (error) {
            log.error('Twilio SMS error', { error });
            return { success: false, error: 'SMS service failed' };
        }
    }

    private async sendWhatsApp(options: SendOptions) {
        // Pattern: Similar to SMS but using TWILIO 'whatsapp:' prefix
        log.info('MOCK: WhatsApp logic (Twilio WhatsApp integration pending keys)', { userId: options.userId });
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

    async broadcastPromotion(options: { title: string, body: string, segments?: string[] }) {
        log.info('Broadcasting promotion', options);
        
        const { data: users } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(100); 

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
