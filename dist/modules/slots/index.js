"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotsService = exports.slotsRouter = void 0;
var slots_routes_1 = require("./slots.routes");
Object.defineProperty(exports, "slotsRouter", { enumerable: true, get: function () { return slots_routes_1.slotsRouter; } });
var slots_service_1 = require("./slots.service");
Object.defineProperty(exports, "slotsService", { enumerable: true, get: function () { return slots_service_1.slotsService; } });
__exportStar(require("./slots.schema"), exports);
//# sourceMappingURL=index.js.map