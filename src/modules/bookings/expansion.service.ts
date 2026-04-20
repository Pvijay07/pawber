import { supabaseAdmin } from '../../shared/lib/supabase';
import { communications } from '../../shared/lib/communications';
import { getIO } from '../../shared/lib/socket';
import { createLogger } from '../../shared/lib/logger';

const log = createLogger('ExpansionService');

export class ExpansionService {
    
    /**
     * Finds providers within a specific radius that haven't been notified yet for this booking.
     */
    async findProvidersInRange(lat: number, lng: number, radiusKm: number, category: string) {
        const { data, error } = await (supabaseAdmin as any).from('providers')
            .select(`
                id, 
                user_id,
                latitude,
                longitude,
                business_name
            `)
            .eq('status', 'approved')
            .eq('is_online', true)
            .eq('category', category);

        if (error) {
            log.error('Failed to fetch providers for expansion', { error });
            return [];
        }

        // Filter by distance manually since we use the local shim
        // In real production, this would be a PostGIS query
        return data.filter((p: any) => {
            if (!p.latitude || !p.longitude) return false;
            const dist = this.calculateDistance(lat, lng, Number(p.latitude), Number(p.longitude));
            return dist <= radiusKm;
        });
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * The heart of the expansion logic. Runs every minute to check who needs expanding.
     */
    async processDueExpansions() {
        const now = new Date();
        
        // 1. Get due expansions
        const { data: due, error } = await supabaseAdmin
            .from('booking_expansion_queue')
            .select(`
                *,
                booking:bookings(id, latitude, longitude, service_id, booking_type, status, services(category_id, name))
            `)
            .lt('next_expansion_at', now.toISOString())
            .gt('expires_at', now.toISOString());

        if (error) return;
        if (!due || due.length === 0) return;

        for (const item of due) {
            const booking = item.booking;
            
            // Safety check: if booking is no longer pending, remove from queue
            if (booking.status !== 'pending') {
                await this.removeFromQueue(item.booking_id);
                continue;
            }

            const nextRadius = item.current_radius === 5 ? 10 : 20;
            const isLastExpansion = item.current_radius === 20;

            log.info('Expanding booking radius', { bookingId: item.booking_id, from: item.current_radius, to: nextRadius });

            // Find providers in the NEW ring (between old radius and new radius)
            // For simplicity, we just find everyone in the new radius and notify them again if needed, 
            // but usually we aim for those not yet notified.
            const providers = await this.findProvidersInRange(
                Number(booking.latitude), 
                Number(booking.longitude), 
                nextRadius, 
                booking.services?.category_id || 'grooming'
            );

            if (providers.length > 0) {
                await this.notifyProviders(booking, providers);
            }

            if (isLastExpansion) {
                // We reached 20km. Stop expanding.
                await this.removeFromQueue(item.booking_id);
            } else {
                // Update queue for next expansion
                const intervalMinutes = booking.booking_type === 'instant' ? 10 : 60;
                const nextTime = new Date(now.getTime() + intervalMinutes * 60000);
                
                await supabaseAdmin
                    .from('booking_expansion_queue')
                    .update({
                        current_radius: nextRadius,
                        last_notified_at: now.toISOString(),
                        next_expansion_at: nextTime.toISOString()
                    })
                    .eq('booking_id', item.booking_id);
            }
        }

        // 2. Handle expired instant bookings (30 mins passed)
        const { data: expired } = await supabaseAdmin
            .from('booking_expansion_queue')
            .select('booking_id, booking_type')
            .lt('expires_at', now.toISOString());

        if (expired && expired.length > 0) {
            for (const item of expired) {
                log.info('Booking search timed out', { bookingId: item.booking_id });
                
                // Update booking status
                await supabaseAdmin
                    .from('bookings')
                    .update({ status: 'cancelled', cancelled_reason: 'No provider found within 30 minutes' })
                    .eq('id', item.booking_id);

                // Notify client
                const { data: booking } = await supabaseAdmin.from('bookings').select('user_id').eq('id', item.booking_id).single();
                if (booking) {
                    await communications.send({
                        userId: booking.user_id,
                        title: 'No Provider Found',
                        body: 'We couldn\'t find a provider for your instant booking. Please try scheduling for later or try again.',
                        data: { type: 'booking_timeout', bookingId: item.booking_id }
                    });
                    
                    // Emit socket event to client
                    try {
                        getIO().to(`booking_${item.booking_id}`).emit('booking_timeout', { bookingId: item.booking_id });
                    } catch (e) {}
                }

                await this.removeFromQueue(item.booking_id);
            }
        }
    }

    async notifyProviders(booking: any, providers: any[]) {
        const io = getIO();
        
        for (const p of providers) {
            // 1. Socket Emit (Real-time popup)
            io.emit('NEW_BOOKING_REQUEST', {
                providerId: p.id,
                bookingId: booking.id,
                serviceName: booking.services?.name,
                distance: this.calculateDistance(Number(booking.latitude), Number(booking.longitude), Number(p.latitude), Number(p.longitude)).toFixed(1)
            });

            // 2. Push Notification
            await communications.send({
                userId: p.user_id,
                title: 'New Booking Nearby! 🐾',
                body: `New ${booking.services?.name} request within your area. Open to accept!`,
                data: { 
                    type: 'new_booking', 
                    bookingId: booking.id,
                    latitude: booking.latitude,
                    longitude: booking.longitude
                }
            });
        }
    }

    async addToQueue(bookingId: string, type: 'instant' | 'scheduled') {
        const now = new Date();
        const intervalMinutes = type === 'instant' ? 10 : 60;
        const expiryMinutes = type === 'instant' ? 30 : 180; // Scheduled bookings expire after 3h of no acceptance?

        await supabaseAdmin
            .from('booking_expansion_queue')
            .insert({
                booking_id: bookingId,
                booking_type: type,
                current_radius: 5,
                last_notified_at: now.toISOString(),
                next_expansion_at: new Date(now.getTime() + intervalMinutes * 60000).toISOString(),
                expires_at: new Date(now.getTime() + expiryMinutes * 60000).toISOString()
            });
    }

    async removeFromQueue(bookingId: string) {
        await supabaseAdmin.from('booking_expansion_queue').delete().eq('booking_id', bookingId);
    }
}

export const expansionService = new ExpansionService();
