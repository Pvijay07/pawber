import { ServiceResult } from '../../shared/types';
import { CreateReviewInput, ReplyReviewInput } from './reviews.schema';
export declare class ReviewsService {
    getByProvider(providerId: string, limit: number, offset: number): Promise<ServiceResult<any>>;
    create(userId: string, input: CreateReviewInput): Promise<ServiceResult<any>>;
    reply(userId: string, reviewId: string, input: ReplyReviewInput): Promise<ServiceResult<any>>;
}
export declare const reviewsService: ReviewsService;
//# sourceMappingURL=reviews.service.d.ts.map