"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../../shared/middleware");
const middleware_2 = require("../../shared/middleware");
const utils_1 = require("../../shared/utils");
const auth_controller_1 = require("./auth.controller");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
exports.authRouter = router;
// Public routes (with stricter rate limiting)
router.post('/signup', middleware_2.authLimiter, (0, middleware_1.validate)(auth_schema_1.signUpSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.signUp.bind(auth_controller_1.authController)));
router.post('/signin', middleware_2.authLimiter, (0, middleware_1.validate)(auth_schema_1.signInSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.signIn.bind(auth_controller_1.authController)));
router.post('/refresh', (0, middleware_1.validate)(auth_schema_1.refreshTokenSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.refreshToken.bind(auth_controller_1.authController)));
// Protected routes
router.get('/me', middleware_1.authenticate, (0, utils_1.asyncHandler)(auth_controller_1.authController.getProfile.bind(auth_controller_1.authController)));
router.patch('/me', middleware_1.authenticate, (0, middleware_1.validate)(auth_schema_1.updateProfileSchema), (0, utils_1.asyncHandler)(auth_controller_1.authController.updateProfile.bind(auth_controller_1.authController)));
router.post('/signout', middleware_1.authenticate, (0, utils_1.asyncHandler)(auth_controller_1.authController.signOut.bind(auth_controller_1.authController)));
//# sourceMappingURL=auth.routes.js.map