"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = void 0;
exports.parsePagination = parsePagination;
const zod_1 = require("zod");
/**
 * Standard pagination query parameters schema.
 * Use with validateQuery middleware.
 */
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
});
/**
 * Parse pagination from Express query object.
 */
function parsePagination(query) {
    return exports.paginationSchema.parse(query);
}
//# sourceMappingURL=pagination.js.map