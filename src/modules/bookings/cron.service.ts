import cron from 'node-cron';
import { supabaseAdmin } from '../../shared/lib';
import { notificationsService } from '../notifications/notifications.service';
import { tierService } from '../providers/tier.service';
import { createLogger } from '../../shared/lib/logger';

const log = createLogger('WalkCronService');

export class WalkCronService {
    public start() {
        // Run every minute
        cron.schedule('* * * * *', async () => {
            try {
                await this.checkScheduledWalks();
            } catch (err) {
                log.error('Error running checkScheduledWalks cron', err);
            }
        });
        log.info('WalkCronService started - scheduling walk reminders.');
    }

    private async checkScheduledWalks() {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch walks scheduled for today that haven't started tracking
        const { data: bookings, error } = await supabaseAdmin
            .from('bookings')
            .select(`
                id,
                user_id,
                provider_id,
                booking_date,
                status,
                tracking_started,
                tracking_missed,
                services!inner(slug),
                provider_slots!inner(start_time),
                providers!inner(user_id)
            `)
            .eq('services.slug', 'walking')
            .eq('status', 'confirmed')
            .eq('tracking_started', false)
            .eq('tracking_missed', false)
            .eq('booking_date', today);

        if (error) {
            log.error('Failed to fetch scheduled walks', error);
            return;
        }

        if (!bookings || bookings.length === 0) return;

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        for (const booking of bookings) {
            // Parse start_time (e.g., "14:30:00")
            const startTimeStr = booking.provider_slots?.start_time;
            if (!startTimeStr) continue;

            const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
            const startTotalMinutes = startHours * 60 + startMinutes;
            const diffMinutes = currentTotalMinutes - startTotalMinutes;
            
            const providerUserId = booking.providers?.user_id;
            const customerUserId = booking.user_id;
            const walkId = booking.id;
            
            if (!providerUserId) continue;

            const dataPayload = { url: `app://walk/start?walk_id=${walkId}` };

            // T - 10 mins -> Upcoming walk
            if (diffMinutes === -10) {
                await notificationsService.notifyUser(
                    providerUserId,
                    'Walk scheduled soon',
                    'Your walk is scheduled in 10 minutes. Get ready!',
                    dataPayload
                );
                log.info(`Sent T-10 reminder for walk ${walkId}`);
            }
            // T time -> Start now
            else if (diffMinutes === 0) {
                await notificationsService.notifyUser(
                    providerUserId,
                    'Walk scheduled now',
                    'Start tracking for the scheduled walk now.',
                    dataPayload
                );
                log.info(`Sent T-0 reminder for walk ${walkId}`);
            }
            // T + 5 mins -> Escalation reminder
            else if (diffMinutes === 5) {
                await notificationsService.notifyUser(
                    providerUserId,
                    'Walk delayed',
                    'You are 5 minutes late to start tracking the walk. Please start now!',
                    dataPayload
                );
                log.info(`Sent T+5 escalation reminder for walk ${walkId}`);
            }
            // T + 10 mins -> Missed Start
            else if (diffMinutes >= 10) {
                // Mark as missed
                await supabaseAdmin
                    .from('bookings')
                    .update({ tracking_missed: true })
                    .eq('id', walkId);

                await notificationsService.notifyUser(
                    providerUserId,
                    'Walk missed',
                    'You missed the scheduled start time for the walk.',
                    dataPayload
                );

                if (customerUserId) {
                    await notificationsService.notifyUser(
                        customerUserId,
                        'Walker delayed ⏱️',
                        'Your walker is delayed in starting the scheduled walk.',
                        { url: `app://walk/status?walk_id=${walkId}` }
                    );
                }
                
                // Penalty: Add strike for late start
                await tierService.addStrike(booking.provider_id, walkId, 'late');
                
                log.info(`Marked walk ${walkId} as missed, notified customer/provider, and added strike.`);
            }
        }
    }
}

export const walkCronService = new WalkCronService();
