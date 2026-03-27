"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const notifications_controller_1 = require("./notifications.controller");
const router = (0, express_1.Router)();
exports.notificationsRouter = router;
router.use(middleware_1.authenticate);
router.get('/', (0, utils_1.asyncHandler)(notifications_controller_1.notificationsController.list.bind(notifications_controller_1.notificationsController)));
router.patch('/read-all', (0, utils_1.asyncHandler)(notifications_controller_1.notificationsController.markAllAsRead.bind(notifications_controller_1.notificationsController)));
router.patch('/:id/read', (0, utils_1.asyncHandler)(notifications_controller_1.notificationsController.markAsRead.bind(notifications_controller_1.notificationsController)));
router.delete('/:id', (0, utils_1.asyncHandler)(notifications_controller_1.notificationsController.delete.bind(notifications_controller_1.notificationsController)));
//# sourceMappingURL=notifications.routes.js.map