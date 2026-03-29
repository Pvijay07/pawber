"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const app = (0, app_1.createApp)();
const PORT = config_1.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`\n🐾 PetCare API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${config_1.env.NODE_ENV || 'development'}\n`);
});
exports.default = app;
//# sourceMappingURL=index.js.map