"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
/**
 * Helper to create success result
 */
function ok(data, statusCode = 200) {
    return { success: true, data, statusCode };
}
/**
 * Helper to create error result
 */
function fail(error, statusCode = 400, details) {
    return { success: false, error, statusCode, details };
}
//# sourceMappingURL=common.js.map