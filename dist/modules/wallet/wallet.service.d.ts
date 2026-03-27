import { ServiceResult } from '../../shared/types';
import { AddFundsInput, PayInput, AutoRechargeInput } from './wallet.schema';
export declare class WalletService {
    getOrCreate(userId: string): Promise<ServiceResult<any>>;
    getTransactions(userId: string, query: {
        type?: string;
        limit: number;
        offset: number;
    }): Promise<ServiceResult<any>>;
    addFunds(userId: string, input: AddFundsInput): Promise<ServiceResult<any>>;
    pay(userId: string, input: PayInput): Promise<ServiceResult<any>>;
    updateAutoRecharge(userId: string, input: AutoRechargeInput): Promise<ServiceResult<any>>;
}
export declare const walletService: WalletService;
//# sourceMappingURL=wallet.service.d.ts.map