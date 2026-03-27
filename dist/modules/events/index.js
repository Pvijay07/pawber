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
exports.eventsService = exports.eventsRouter = void 0;
var events_routes_1 = require("./events.routes");
Object.defineProperty(exports, "eventsRouter", { enumerable: true, get: function () { return events_routes_1.eventsRouter; } });
var events_service_1 = require("./events.service");
Object.defineProperty(exports, "eventsService", { enumerable: true, get: function () { return events_service_1.eventsService; } });
__exportStar(require("./events.schema"), exports);
//# sourceMappingURL=index.js.map