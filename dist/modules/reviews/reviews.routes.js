"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const reviews_controller_1 = require("./reviews.controller");
const reviews_schema_1 = require("./reviews.schema");
const router = (0, express_1.Router)();
exports.reviewsRouter = router;
// Public
router.get('/provider/:providerId', (0, utils_1.asyncHandler)(reviews_controller_1.reviewsController.getByProvider.bind(reviews_controller_1.reviewsController)));
// Protected
router.post('/', middleware_1.authenticate, (0, middleware_1.validate)(reviews_schema_1.createReviewSchema), (0, utils_1.asyncHandler)(reviews_controller_1.reviewsController.create.bind(reviews_controller_1.reviewsController)));
router.patch('/:id/reply', middleware_1.authenticate, (0, middleware_1.validate)(reviews_schema_1.replyReviewSchema), (0, utils_1.asyncHandler)(reviews_controller_1.reviewsController.reply.bind(reviews_controller_1.reviewsController)));
//# sourceMappingURL=reviews.routes.js.map