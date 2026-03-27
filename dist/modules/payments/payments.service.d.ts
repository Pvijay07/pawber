import { ServiceResult } from '../../shared/types';
import { CreateOrderInput, VerifyPaymentInput, RefundInput } from './payments.schema';
export declare class PaymentsService {
    createOrder(userId: string, input: CreateOrderInput): Promise<ServiceResult<any>>;
    verifyPayment(userId: string, input: VerifyPaymentInput): Promise<ServiceResult<any>>;
    refund(userId: string, input: RefundInput): Promise<ServiceResult<any>>;
    getHistory(userId: string, limit: number, offset: number): Promise<ServiceResult<any>>;
}
export declare const paymentsService: PaymentsService;
//# sourceMappingURL=payments.service.d.ts.map