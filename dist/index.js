"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const app_1 = require("./app");
const migrate_1 = require("./db/migrate");
async function bootstrap() {
    console.log('🚀 Bootstrapping PetCare API (Legacy Index)...');
    // Run migrations first
    try {
        await (0, migrate_1.migrate)();
    }
    catch (err) {
        console.error('❌ Migration skipped/failed during bootstrap:', err);
    }
    const app = (0, app_1.createApp)();
    const PORT = config_1.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`\n🐾 PetCare API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 Environment: ${config_1.env.NODE_ENV || 'development'}\n`);
    });
}
bootstrap().catch(err => {
    console.error('💥 Critical bootstrap failure:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map