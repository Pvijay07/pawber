import { supabaseAdmin, createLogger } from '../../shared/lib';
import { communications } from '../../shared/lib/communications';

const log = createLogger('TierService');

export class TierService {
    
    // 1. Auto Evaluation (Runs every 7 days)
    async evaluateDueProviders() {
        log.info('Running Auto Evaluation Engine for Providers...');
        
        const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Find providers who need evaluation
        const { data: providers, error } = await supabaseAdmin
            .from('providers')
            .select('id, user_id, tier, rating, last_evaluated_at, strikes_reset_at')
            .or(`last_evaluated_at.lt.${SEVEN_DAYS_AGO},last_evaluated_at.is.null`);

        if (error || !providers) {
            log.error('Failed to fetch providers for evaluation', { error });
            return;
        }

        for (const provider of providers) {
            await this.evaluateSingleProvider(provider, THIRTY_DAYS_AGO);
            await this.checkAndResetStrikes(provider);
        }
        log.info(`Evaluated ${providers.length} providers.`);
    }

    private async evaluateSingleProvider(provider: any, thirtyDaysAgo: string) {
        try {
            // Get last 30 days bookings
            const { data: bookings } = await supabaseAdmin
                .from('bookings')
                .select('id, status, user_id, completed_at')
                .eq('provider_id', provider.id)
                .gte('created_at', thirtyDaysAgo);

            const total = bookings?.length || 0;
            const completed = bookings?.filter(b => b.status === 'completed').length || 0;
            const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0;
            
            // Assuming we track complaints in disputes
            const { data: disputes } = await supabaseAdmin
                .from('disputes')
                .select('id')
                .eq('raised_by', 'client') // Conceptual
                .gte('created_at', thirtyDaysAgo);
                
            const complaintCount = disputes?.length || 0;
            const complaintRate = total > 0 ? (complaintCount / total) * 100 : 0;
            const completionRate = total > 0 ? (completed / total) * 100 : 100;
            const onTimePercentage = 95; // Dummy: Replace with actual on-time tracking logic
            
            // Repeat clients
            let repeatClientRate = 0;
            if (bookings && bookings.length > 0) {
                const uniqueClients = new Set(bookings.map(b => b.user_id)).size;
                repeatClientRate = ((total - uniqueClients) / total) * 100;
            }

            // 3. Ranking Algorithm
            // Score = (40%) Rating + (20%) On-time + (15%) Completion rate + (15%) Recent activity + (10%) Repeat clients
            const normalizedRating = (provider.rating / 5) * 100;
            const recentActivityScore = Math.min((completed / 10) * 100, 100); // 10 walks = 100% activity score
            
            const rankingScore = (
                (normalizedRating * 0.40) +
                (onTimePercentage * 0.20) +
                (completionRate * 0.15) +
                (recentActivityScore * 0.15) +
                (repeatClientRate * 0.10)
            );

            let newTier = provider.tier;
            let isActive = true;

            // Inactivity rule
            if (total === 0) {
                isActive = false;
            }

            // Hard requirements check to auto-demote if falling below standard
            if (newTier === 1 && (provider.rating < 4.5 || completed < 10 || onTimePercentage < 90 || (cancelled/total*100) > 5)) {
                newTier = 2; 
            } else if (newTier === 2 && (provider.rating < 4.0 || completed < 5 || onTimePercentage < 80 || (cancelled/total*100) > 10)) {
                newTier = 3;
            }

            // Smart Commission calculation based on Tier
            let commissionRate = 15; // default for Tier 3
            if (newTier === 1) commissionRate = 10;
            else if (newTier === 2) commissionRate = 12;

            // Update provider stats
            await supabaseAdmin.from('providers').update({
                completed_bookings: completed,
                cancelled_bookings: cancelled,
                last_30_day_bookings: total,
                complaint_count: complaintCount,
                on_time_percentage: onTimePercentage,
                ranking_score: rankingScore,
                last_evaluated_at: new Date().toISOString(),
                tier: newTier,
                is_active: isActive,
                commission_rate: commissionRate
            }).eq('id', provider.id);

        } catch (e) {
            log.error('Error evaluating provider', { providerId: provider.id, error: e });
        }
    }

    private async checkAndResetStrikes(provider: any) {
        if (!provider.strikes_reset_at) return;
        
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (new Date(provider.strikes_reset_at).getTime() < thirtyDaysAgo) {
            await supabaseAdmin.from('providers').update({
                strike_count: 0,
                strikes_reset_at: new Date().toISOString()
            }).eq('id', provider.id);
        }
    }

    // 2. Strike System
    async addStrike(providerId: string, bookingId: string | null, type: 'late' | 'cancellation' | 'complaint') {
        const pointsMap = { late: 1, cancellation: 2, complaint: 3 };
        const points = pointsMap[type];

        await supabaseAdmin.from('provider_strikes').insert({
            provider_id: providerId,
            booking_id: bookingId,
            strike_type: type,
            points
        });

        // Get current strikes
        const { data: provider } = await supabaseAdmin.from('providers').select('user_id, strike_count, tier').eq('id', providerId).single();
        if (!provider) return;

        const newStrikeCount = (provider.strike_count || 0) + points;
        let updates: any = { strike_count: newStrikeCount };

        // Take Action based on strikes
        let title = 'Performance Strike';
        let message = `You received a strike for ${type}. Current strikes: ${newStrikeCount}.`;

        if (newStrikeCount >= 8) {
            // Freeze
            updates.is_active = false;
            title = 'Account Frozen';
            message = 'You have reached 8 strikes. Your account is frozen for 7 days.';
        } else if (newStrikeCount >= 5) {
            // Downgrade temporarily
            updates.tier = Math.min(provider.tier + 1, 3); // Lower tier (3 is lowest)
            title = 'Tier Downgrade';
            message = 'You have reached 5 strikes. Your tier has been downgraded.';
        } else if (newStrikeCount >= 3) {
            title = 'Warning: High Strikes';
            message = 'You have reached 3 strikes. Please improve your performance to avoid downgrade.';
        }

        await supabaseAdmin.from('providers').update(updates).eq('id', providerId);

        // Notify
        await communications.send({
            userId: provider.user_id,
            title,
            body: message,
            data: { type: 'strike_alert', newStrikeCount }
        });
    }

    // 3. Upgrade Request Flow
    async requestUpgrade(providerId: string, requestedTier: number) {
        const { data: provider } = await supabaseAdmin.from('providers').select('*').eq('id', providerId).single();
        if (!provider) throw new Error('Provider not found');

        let isEligible = false;
        let needsOpsReview = false;

        // Eligibility Check
        if (requestedTier === 1) {
            isEligible = provider.rating >= 4.5 && provider.completed_bookings >= 30 && provider.on_time_percentage >= 90 && provider.is_certified;
            if (provider.rating >= 4.4 && provider.completed_bookings >= 25) needsOpsReview = true;
        } else if (requestedTier === 2) {
            isEligible = provider.rating >= 4.0 && provider.completed_bookings >= 10 && provider.on_time_percentage >= 80;
            if (provider.rating >= 3.9 && provider.completed_bookings >= 8) needsOpsReview = true;
        }

        const status = isEligible ? 'approved' : (needsOpsReview ? 'ops_review' : 'rejected');

        await supabaseAdmin.from('tier_upgrade_requests').insert({
            provider_id: providerId,
            requested_tier: requestedTier,
            status
        });

        if (status === 'approved') {
            await supabaseAdmin.from('providers').update({ tier: requestedTier }).eq('id', providerId);
        }

        return { status, message: status === 'approved' ? 'Upgrade successful' : (status === 'ops_review' ? 'Sent for review' : 'Not eligible yet') };
    }

    // 4. Earnings Multiplier (Dynamic)
    calculatePayoutMultiplier(tier: number, isPeakDemand: boolean = false): number {
        if (tier === 1) return isPeakDemand ? 1.3 : 1.2;
        if (tier === 2) return 1.0;
        return 0.8; // Tier 3
    }
}

export const tierService = new TierService();
