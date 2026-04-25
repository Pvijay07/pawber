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

    /**
     * AI Matching Engine: SP auto Matching to Jobs & suggesting Required SP by location.
     * Ranks providers based on tier, rating, certification, and distance.
     */
    async matchProviders(jobParams: { latitude: number, longitude: number, category: string, limit?: number }): Promise<ServiceResult<any>> {
        try {
            // Fetch active, approved providers for this category
            const { data: providers, error } = await supabaseAdmin
                .from('providers')
                .select('id, user_id, business_name, category, latitude, longitude, rating, total_reviews, tier, is_certified, is_online, status')
                .eq('status', 'approved')
                .eq('category', jobParams.category);

            if (error || !providers) {
                return fail('Failed to fetch providers', 500);
            }

            // Calculate distance and match score
            const toRad = (value: number) => value * Math.PI / 180;
            const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371; // km
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const matchedProviders = providers.map((p: any) => {
                let distance = 0;
                if (p.latitude && p.longitude && jobParams.latitude && jobParams.longitude) {
                    distance = calcDistance(jobParams.latitude, jobParams.longitude, Number(p.latitude), Number(p.longitude));
                } else {
                    distance = 999; // unknown distance penalty
                }

                // AI Match Score Formula:
                // Base: Rating (0-5) * 20 = Max 100
                // Tier: Tier 1 (+30), Tier 2 (+15), Tier 3 (0)
                // Cert: Certified (+10)
                // Distance: -2 points per km
                let score = (Number(p.rating || 0) * 20);
                if (p.tier === 1) score += 30;
                else if (p.tier === 2) score += 15;
                if (p.is_certified) score += 10;
                
                score -= (distance * 2);

                return {
                    ...p,
                    distance_km: Math.round(distance * 10) / 10,
                    match_score: Math.max(0, Math.round(score))
                };
            });

            // Sort so right bids come on top
            matchedProviders.sort((a: any, b: any) => b.match_score - a.match_score);

            const limit = jobParams.limit || 10;
            return ok({
                matches: matchedProviders.slice(0, limit)
            });

        } catch (err: any) {
            log.error('AI Matching Error:', err);
            return fail('Failed to match providers', 500);
        }
    }
}

export const aiService = new AIService();
