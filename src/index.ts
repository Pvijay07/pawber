import { env } from './config';
import { createApp } from './app';
import { migrate } from './db/migrate';

async function bootstrap() {
    console.log('🚀 Bootstrapping Pawber API (Legacy Index)...');
    
    // Run migrations first
    try {
        await migrate();
    } catch (err) {
        console.error('❌ Migration skipped/failed during bootstrap:', err);
    }
    
    const app = createApp();
    const PORT = env.PORT || 4000;

    app.listen(PORT, () => {
        console.log(`\n🐾 Pawber API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 Environment: ${env.NODE_ENV || 'development'}\n`);
    });
}

bootstrap().catch(err => {
    console.error('💥 Critical bootstrap failure:', err);
    process.exit(1);
});
