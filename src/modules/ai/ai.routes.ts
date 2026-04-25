import { Router } from 'express';
import { aiService } from './ai.service';
import { authenticate } from '../../shared/middleware';
import { AuthRequest, ok, fail } from '../../shared/types';

const router = Router();

/**
 * POST /ai/chat
 */
router.post('/chat', authenticate, async (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json(fail('Unauthorized', 401));
    
    const { message } = req.body;
    if (!message) return res.status(400).json(fail('Message is required', 400));

    const result = await aiService.getChatResponse(req.user.id, message);
    return res.status(result.statusCode || 200).json(result);
});
/**
 * GET /ai/match-sps
 * Auto match SPs to jobs based on location, tier, etc.
 */
router.get('/match-sps', authenticate, async (req: AuthRequest, res) => {
    try {
        const { latitude, longitude, category, limit } = req.query;
        
        if (!latitude || !longitude || !category) {
            return res.status(400).json(fail('latitude, longitude, and category are required', 400));
        }

        const result = await aiService.matchProviders({
            latitude: Number(latitude),
            longitude: Number(longitude),
            category: String(category),
            limit: limit ? Number(limit) : undefined
        });

        return res.status(result.statusCode || 200).json(result);
    } catch (err) {
        return res.status(500).json(fail('Internal server error', 500));
    }
});

export { router as aiRouter };
