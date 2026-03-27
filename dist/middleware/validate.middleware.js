"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
/**
 * Middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (cleaned) data.
 */
function validate(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(result.error); // caught by error.middleware
        }
        req.body = result.data;
        next();
    };
}
/**
 * Validates query parameters.
 */
function validateQuery(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return next(result.error);
        }
        req.query = result.data;
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map