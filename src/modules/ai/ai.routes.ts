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

export { router as aiRouter };
