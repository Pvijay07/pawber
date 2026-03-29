"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const services_controller_1 = require("./services.controller");
const services_schema_1 = require("./services.schema");
const router = (0, express_1.Router)();
exports.servicesRouter = router;
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
router.get('/categories', (0, utils_1.asyncHandler)(services_controller_1.servicesController.listCategories.bind(services_controller_1.servicesController)));
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
router.get('/', (0, utils_1.asyncHandler)(services_controller_1.servicesController.listServices.bind(services_controller_1.servicesController)));
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
router.get('/:id', (0, utils_1.asyncHandler)(services_controller_1.servicesController.getServiceById.bind(services_controller_1.servicesController)));
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
router.post('/categories', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, middleware_1.validate)(services_schema_1.createCategorySchema), (0, utils_1.asyncHandler)(services_controller_1.servicesController.createCategory.bind(services_controller_1.servicesController)));
/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, middleware_1.validate)(services_schema_1.createServiceSchema), (0, utils_1.asyncHandler)(services_controller_1.servicesController.createService.bind(services_controller_1.servicesController)));
/**
 * @swagger
 * /api/services/{serviceId}/packages:
 *   post:
 *     summary: Add package to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:serviceId/packages', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, middleware_1.validate)(services_schema_1.createPackageSchema), (0, utils_1.asyncHandler)(services_controller_1.servicesController.createPackage.bind(services_controller_1.servicesController)));
/**
 * @swagger
 * /api/services/{serviceId}/addons:
 *   post:
 *     summary: Add addon to service (Admin)
 *     tags: [Services]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:serviceId/addons', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, middleware_1.validate)(services_schema_1.createAddonSchema), (0, utils_1.asyncHandler)(services_controller_1.servicesController.createAddon.bind(services_controller_1.servicesController)));
router.patch('/categories/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.updateCategory.bind(services_controller_1.servicesController)));
router.patch('/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.updateService.bind(services_controller_1.servicesController)));
router.patch('/:serviceId/packages/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.updatePackage.bind(services_controller_1.servicesController)));
router.patch('/:serviceId/addons/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.updateAddon.bind(services_controller_1.servicesController)));
router.delete('/categories/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.deleteItem.bind(services_controller_1.servicesController)));
router.delete('/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.deleteItem.bind(services_controller_1.servicesController)));
router.delete('/:serviceId/packages/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.deleteItem.bind(services_controller_1.servicesController)));
router.delete('/:serviceId/addons/:id', middleware_1.authenticate, (0, middleware_1.authorize)('admin'), (0, utils_1.asyncHandler)(services_controller_1.servicesController.deleteItem.bind(services_controller_1.servicesController)));
//# sourceMappingURL=services.routes.js.map