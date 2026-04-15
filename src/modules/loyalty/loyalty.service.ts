import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';

const log = createLogger('LoyaltyService');

export class LoyaltyService {
    /**
     * Checks if a user is eligible for a loyalty reward (Free service up to 1500).
     * Condition: 1 paid completed booking in each of the last 4 consecutive months.
     */
    async checkLoyaltyEligibility(userId: string): Promise<{ isEligible: boolean; currentStreak: number; progress: string[] }> {
        const monthsToCheck = 4;
        const streakMonths: string[] = [];
        let consecutiveMonths = 0;

        for (let i = 1; i <= monthsToCheck; i++) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - i);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0);
            endDate.setHours(23, 59, 59, 999);

            const { count, error } = await supabaseAdmin
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'completed')
                .eq('is_loyalty_reward', false) // Must be a paid booking
                .gte('booking_date', startDate.toISOString().split('T')[0])
                .lte('booking_date', endDate.toISOString().split('T')[0]);

            if (error) {
                log.error('Error checking monthly booking:', error);
                break;
            }

            const monthName = startDate.toLocaleString('default', { month: 'short' });
            if (count && count > 0) {
                consecutiveMonths++;
                streakMonths.push(`${monthName} (Done)`);
            } else {
                streakMonths.push(`${monthName} (Pending)`);
                // Since it's consecutive, once we hit a gap, we stop incrementing consecutiveMonths
                // but we might want to continue to show progress UI.
            }
        }

        // Check if a free booking has already been used in the current month
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const { data: usedThisMonth } = await supabaseAdmin
            .from('bookings')
            .select('id')
            .eq('user_id', userId)
            .eq('is_loyalty_reward', true)
            .gte('created_at', currentMonthStart.toISOString())
            .limit(1);

        const isEligible = consecutiveMonths === monthsToCheck && (!usedThisMonth || usedThisMonth.length === 0);

        return {
            isEligible,
            currentStreak: consecutiveMonths,
            progress: streakMonths.reverse()
        };
    }

    /**
     * Calculate points to earn for a booking (5 points per 100).
     */
    async calculatePointsToEarn(amount: number): Promise<number> {
        return Math.floor(amount / 100) * 5;
    }

    /**
     * Credit points to a user wallet.
     */
    async creditPoints(userId: string, amount: number, source: string, referenceId?: string): Promise<void> {
        if (amount <= 0) return;

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('points_balance')
            .eq('user_id', userId)
            .single();

        const newPoints = (wallet?.points_balance || 0) + amount;

        await supabaseAdmin
            .from('wallets')
            .update({ points_balance: newPoints })
            .eq('user_id', userId);

        await supabaseAdmin
            .from('points_transactions')
            .insert({
                user_id: userId,
                amount,
                source,
                reference_id: referenceId
            });

        log.info('Points credited', { userId, amount, source });
    }

    /**
     * Debit points from a user wallet.
     */
    async debitPoints(userId: string, amount: number, referenceId?: string): Promise<void> {
        if (amount <= 0) return;

        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('points_balance')
            .eq('user_id', userId)
            .single();

        const newPoints = Math.max(0, (wallet?.points_balance || 0) - amount);

        await supabaseAdmin
            .from('wallets')
            .update({ points_balance: newPoints })
            .eq('user_id', userId);

        await supabaseAdmin
            .from('points_transactions')
            .insert({
                user_id: userId,
                amount: -amount,
                source: 'booking_redemption',
                reference_id: referenceId
            });

        log.info('Points debited', { userId, amount });
    }

    /**
     * Handle referral reward issuance.
     */
    async processReferralReward(refereeId: string): Promise<void> {
        // Check if this user was referred
        const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('*')
            .eq('referee_id', refereeId)
            .eq('status', 'pending')
            .single();

        if (!referral) return;

        // Issue 200 points to both parties
        const rewardAmount = 200;
        
        await this.creditPoints(referral.referrer_id, rewardAmount, 'referral_bonus', referral.id);
        await this.creditPoints(refereeId, rewardAmount, 'referral_bonus', referral.id);

        await supabaseAdmin
            .from('referrals')
            .update({ status: 'completed', reward_issued: true })
            .eq('id', referral.id);

        log.info('Referral reward issued', { referralId: referral.id });
    }
}

export const loyaltyService = new LoyaltyService();
