"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config_1 = require("./config");
const app_1 = require("./app");
const app = (0, app_1.createApp)();
app.listen(config_1.env.PORT, () => {
    console.log(`\n🐾 PetCare API v2.0 running on http://localhost:${config_1.env.PORT}`);
    console.log(`📋 Health check: http://localhost:${config_1.env.PORT}/health`);
    console.log(`🔧 Environment: ${config_1.env.NODE_ENV}\n`);
});
//# sourceMappingURL=server.js.map