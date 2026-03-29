import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { servicesController } from './services.controller';
import { createCategorySchema, createServiceSchema, createPackageSchema, createAddonSchema } from './services.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Pet service catalog and categories
 */

// ─── Public Routes ──────────────────────────────
/**
 * @swagger
 * /api/services/categories:
 *   get:
 *     summary: List all service categories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', asyncHandler(servicesController.listCategories.bind(servicesController)));

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/', asyncHandler(servicesController.listServices.bind(servicesController)));

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service details with packages
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 */
router.get('/:id', asyncHandler(servicesController.getServiceById.bind(servicesController)));

// ─── Admin Routes ───────────────────────────────
/**
 * @swagger
 * /api/services/categories:
 *   post:
 *     summary: Create a category (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/categories', authenticate, authorize('admin'), validate(createCategorySchema), asyncHandler(servicesController.createCategory.bind(servicesController)));

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', authenticate, authorize('admin'), validate(createServiceSchema), asyncHandler(servicesController.createService.bind(servicesController)));

/**
 * @swagger
 * /api/services/{serviceId}/packages:
 *   post:
 *     summary: Add package to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:serviceId/packages', authenticate, authorize('admin'), validate(createPackageSchema), asyncHandler(servicesController.createPackage.bind(servicesController)));

/**
 * @swagger
 * /api/services/{serviceId}/addons:
 *   post:
 *     summary: Add addon to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
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
