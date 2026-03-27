import { ServiceResult } from '../../shared/types';
export declare class ServicesService {
    listCategories(): Promise<ServiceResult<any>>;
    listServices(categoryId?: string): Promise<ServiceResult<any>>;
    getServiceById(serviceId: string): Promise<ServiceResult<any>>;
    createCategory(input: any): Promise<ServiceResult<any>>;
    createService(input: any): Promise<ServiceResult<any>>;
    createPackage(serviceId: string, input: any): Promise<ServiceResult<any>>;
    createAddon(serviceId: string, input: any): Promise<ServiceResult<any>>;
    updateCategory(id: string, input: any): Promise<ServiceResult<any>>;
    updateService(id: string, input: any): Promise<ServiceResult<any>>;
    updatePackage(id: string, input: any): Promise<ServiceResult<any>>;
    updateAddon(id: string, input: any): Promise<ServiceResult<any>>;
    deleteItem(table: string, id: string): Promise<ServiceResult<any>>;
}
export declare const servicesService: ServicesService;
//# sourceMappingURL=services.service.d.ts.map