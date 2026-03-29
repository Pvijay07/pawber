"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const migrate_1 = require("./db/migrate");
const app = (0, app_1.createApp)();
async function startServer() {
    try {
        // Run migrations on startup (especially for Render/fresh environments)
        if (config_1.env.NODE_ENV !== 'test') {
            await (0, migrate_1.migrate)();
        }
        app.listen(config_1.env.PORT, () => {
            console.log(`\n🐾 PetCare API v2.0 running on http://localhost:${config_1.env.PORT}`);
            console.log(`📋 Health check: http://localhost:${config_1.env.PORT}/health`);
            console.log(`🔧 Environment: ${config_1.env.NODE_ENV}\n`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map