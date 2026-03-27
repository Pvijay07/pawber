"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
/**
 * Standardized API response helpers.
 * Ensures consistent response format across all endpoints.
 */
class ApiResponse {
    static success(res, data, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data,
        });
    }
    static created(res, data) {
        return this.success(res, data, 201);
    }
    static paginated(res, data, meta) {
        return res.status(200).json({
            success: true,
            data,
            meta: {
                total: meta.total,
                limit: meta.limit,
                offset: meta.offset,
                hasMore: meta.offset + meta.limit < meta.total,
            },
        });
    }
    static error(res, message, statusCode = 500, details) {
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                ...(details && { details }),
            },
        });
    }
    static noContent(res) {
        return res.status(204).send();
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map