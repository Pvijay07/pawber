import { ServiceResult } from '../../shared/types';
import { CreatePetInput, UpdatePetInput } from './pets.schema';
export declare class PetsService {
    list(userId: string): Promise<ServiceResult<any>>;
    getById(userId: string, petId: string): Promise<ServiceResult<any>>;
    create(userId: string, input: CreatePetInput): Promise<ServiceResult<any>>;
    update(userId: string, petId: string, input: UpdatePetInput): Promise<ServiceResult<any>>;
    softDelete(userId: string, petId: string): Promise<ServiceResult<any>>;
}
export declare const petsService: PetsService;
//# sourceMappingURL=pets.service.d.ts.map