"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    async signUp(req, res, _next) {
        const result = await auth_service_1.authService.signUp(req.body);
        const status = result.success ? (result.statusCode || 201) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async signIn(req, res, _next) {
        const result = await auth_service_1.authService.signIn(req.body);
        const status = result.success ? (result.statusCode || 200) : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async getProfile(req, res, _next) {
        const result = await auth_service_1.authService.getProfile(req.user.id);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async updateProfile(req, res, _next) {
        const result = await auth_service_1.authService.updateProfile(req.user.id, req.body);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async refreshToken(req, res, _next) {
        const result = await auth_service_1.authService.refreshToken(req.body.refresh_token);
        const status = result.success ? 200 : result.statusCode;
        return res.status(status).json(result.success
            ? { success: true, data: result.data }
            : { success: false, error: { message: result.error } });
    }
    async signOut(req, res, _next) {
        const result = await auth_service_1.authService.signOut(req.accessToken);
        return res.status(200).json({ success: true, data: result.success ? result.data : null });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map