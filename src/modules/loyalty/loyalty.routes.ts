import { Router } from 'express';
import { loyaltyService } from './loyalty.service';
import { AuthRequest, ok, fail } from '../../shared/types';
import { supabaseAdmin } from '../../shared/lib';

const router = Router();

/**
 * GET /loyalty/status
 */
router.get('/status', async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json(fail('Unauthorized', 401));
    
    const status = await loyaltyService.checkLoyaltyEligibility(req.user.id);
    return res.json(ok(status));
});

/**
 * GET /loyalty/points
 */
router.get('/points', async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json(fail('Unauthorized', 401));

    const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('points_balance')
        .eq('user_id', req.user.id)
        .single();

    const { data: transactions } = await supabaseAdmin
        .from('points_transactions')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    return res.json(ok({ balance: wallet?.points_balance || 0, transactions: transactions || [] }));
});

/**
 * GET /loyalty/referral
 */
router.get('/referral', async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json(fail('Unauthorized', 401));

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('referral_code')
        .eq('id', req.user.id)
        .single();

    const { data: referrals } = await supabaseAdmin
        .from('referrals')
        .select(`
            id,
            status,
            created_at,
            referee:profiles!referrals_referee_id_fkey(full_name)
        `)
        .eq('referrer_id', req.user.id);

    return res.json(ok({ code: profile?.referral_code, referrals: referrals || [] }));
});

export { router as loyaltyRouter };
