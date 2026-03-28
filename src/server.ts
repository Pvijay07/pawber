import { env } from './config';
import { createApp } from './app';
import { migrate } from './db/migrate';

const app = createApp();

async function startServer() {
    try {
        // Run migrations on startup (especially for Render/fresh environments)
        if (env.NODE_ENV !== 'test') {
            await migrate();
        }

        app.listen(env.PORT, () => {
            console.log(`\n🐾 PetCare API v2.0 running on http://localhost:${env.PORT}`);
            console.log(`📋 Health check: http://localhost:${env.PORT}/health`);
            console.log(`🔧 Environment: ${env.NODE_ENV}\n`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
