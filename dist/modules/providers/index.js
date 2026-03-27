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
exports.providersService = exports.providersRouter = void 0;
var providers_routes_1 = require("./providers.routes");
Object.defineProperty(exports, "providersRouter", { enumerable: true, get: function () { return providers_routes_1.providersRouter; } });
var providers_service_1 = require("./providers.service");
Object.defineProperty(exports, "providersService", { enumerable: true, get: function () { return providers_service_1.providersService; } });
__exportStar(require("./providers.schema"), exports);
//# sourceMappingURL=index.js.map