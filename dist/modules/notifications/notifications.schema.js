"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotificationsSchema = void 0;
const zod_1 = require("zod");
exports.listNotificationsSchema = zod_1.z.object({
    unread_only: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
    offset: zod_1.z.string().optional(),
});
//# sourceMappingURL=notifications.schema.js.map