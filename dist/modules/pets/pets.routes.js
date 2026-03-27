"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const pets_controller_1 = require("./pets.controller");
const pets_schema_1 = require("./pets.schema");
const router = (0, express_1.Router)();
exports.petsRouter = router;
router.use(middleware_1.authenticate);
router.get('/', (0, utils_1.asyncHandler)(pets_controller_1.petsController.list.bind(pets_controller_1.petsController)));
router.get('/:id', (0, utils_1.asyncHandler)(pets_controller_1.petsController.getById.bind(pets_controller_1.petsController)));
router.post('/', (0, middleware_1.validate)(pets_schema_1.createPetSchema), (0, utils_1.asyncHandler)(pets_controller_1.petsController.create.bind(pets_controller_1.petsController)));
router.patch('/:id', (0, middleware_1.validate)(pets_schema_1.updatePetSchema), (0, utils_1.asyncHandler)(pets_controller_1.petsController.update.bind(pets_controller_1.petsController)));
router.delete('/:id', (0, utils_1.asyncHandler)(pets_controller_1.petsController.delete.bind(pets_controller_1.petsController)));
//# sourceMappingURL=pets.routes.js.map