import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { servicesController } from './services.controller';
import { createCategorySchema, createServiceSchema, createPackageSchema, createAddonSchema } from './services.schema';

const router = Router();

// ─── Public Routes ──────────────────────────────
router.get('/categories', asyncHandler(servicesController.listCategories.bind(servicesController)));
router.get('/', asyncHandler(servicesController.listServices.bind(servicesController)));
router.get('/:id', asyncHandler(servicesController.getServiceById.bind(servicesController)));

// ─── Admin Routes ───────────────────────────────
router.post('/categories', authenticate, authorize('admin'), validate(createCategorySchema), asyncHandler(servicesController.createCategory.bind(servicesController)));
router.post('/', authenticate, authorize('admin'), validate(createServiceSchema), asyncHandler(servicesController.createService.bind(servicesController)));
router.post('/:serviceId/packages', authenticate, authorize('admin'), validate(createPackageSchema), asyncHandler(servicesController.createPackage.bind(servicesController)));
router.post('/:serviceId/addons', authenticate, authorize('admin'), validate(createAddonSchema), asyncHandler(servicesController.createAddon.bind(servicesController)));

router.patch('/categories/:id', authenticate, authorize('admin'), asyncHandler(servicesController.updateCategory.bind(servicesController)));
router.patch('/:id', authenticate, authorize('admin'), asyncHandler(servicesController.updateService.bind(servicesController)));
router.patch('/:serviceId/packages/:id', authenticate, authorize('admin'), asyncHandler(servicesController.updatePackage.bind(servicesController)));
router.patch('/:serviceId/addons/:id', authenticate, authorize('admin'), asyncHandler(servicesController.updateAddon.bind(servicesController)));

router.delete('/categories/:id', authenticate, authorize('admin'), asyncHandler(servicesController.deleteItem.bind(servicesController)));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(servicesController.deleteItem.bind(servicesController)));
router.delete('/:serviceId/packages/:id', authenticate, authorize('admin'), asyncHandler(servicesController.deleteItem.bind(servicesController)));
router.delete('/:serviceId/addons/:id', authenticate, authorize('admin'), asyncHandler(servicesController.deleteItem.bind(servicesController)));

export { router as servicesRouter };
