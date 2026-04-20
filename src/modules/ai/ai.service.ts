import { supabaseAdmin } from '../../shared/lib';
import { createLogger } from '../../shared/lib/logger';
import { ServiceResult, ok, fail } from '../../shared/types';

const log = createLogger('AIService');

export class AIService {
    /**
     * Get an AI response for a support/suggestion query.
     */
    async getChatResponse(userId: string, message: string): Promise<ServiceResult<any>> {
        try {
            // 1. Context Gathering: Get user's pets and services
            const { data: userPets } = await supabaseAdmin.from('pets').select('name, type, breed').eq('owner_id', userId);
            const { data: services } = await supabaseAdmin.from('services').select('name, description');

            const context = {
                userPets: userPets || [],
                availableServices: services || [],
                platform: "Pawber (Pawber Platform)"
            };

            // 2. Simulated AI logic (In production, replace with LLM API call)
            // For now, we provide smart keyword-based responses with "Premium" personality.
            const prompt = message.toLowerCase();
            let aiResponse = "";
            let suggestions: string[] = [];

            if (prompt.includes('hi') || prompt.includes('hello')) {
                const petName = userPets?.[0]?.name || 'your pet';
                aiResponse = `Hello there! I'm your Pawber Concierge. How's ${petName} doing today? I can help you book a service or answer any pet care questions! 🐾`;
                suggestions = ["Book a Grooming session", "Check my wallet", "Refer a friend"];
            } 
            else if (prompt.includes('groom') || prompt.includes('bath') || prompt.includes('spa')) {
                aiResponse = "I highly recommend our 'Premium Spa & Grooming' package for your furry friend. It's our most popular service this month! Shall I show you the available slots? ✨";
                suggestions = ["See Grooming slots", "What's included in Spa?"];
            }
            else if (prompt.includes('refer') || prompt.includes('points') || prompt.includes('earn')) {
                aiResponse = "Did you know? You can earn 200 points for every friend you refer! Plus, you get 5 points for every ₹100 you spend. Your loyalty pays off! 💎";
                suggestions = ["Get my referral code", "How to use points?"];
            }
            else if (prompt.includes('sick') || prompt.includes('vet') || prompt.includes('emergency')) {
                aiResponse = "Oh no! If it's an emergency, please use the EMERGENCY button on the home screen for instant Vet Matching. I'm here to support you! 🙏";
                suggestions = ["Call Emergency Vet", "Nearby Clinics"];
            }
            else {
                aiResponse = "That's a great question! As your pet's personal assistant, I'm constantly learning. For now, I can help you with bookings, rewards, or platform support. What's on your mind? 😊";
                suggestions = ["View all services", "Track my order"];
            }

            return ok({
                message: aiResponse,
                suggestions,
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            log.error('AI Chat Error:', error);
            return fail('The AI concierge is currently napping. Please try again in a bit!', 500);
        }
    }
}

export const aiService = new AIService();
