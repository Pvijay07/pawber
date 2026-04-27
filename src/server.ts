import { createServer } from 'http';
import { env } from './config';
import { createApp } from './app';
import { migrate } from './db/migrate';
import { initializeSocket } from './shared/lib/socket';
import { walkCronService } from './modules/bookings/cron.service';

const app = createApp();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

async function startServer() {
    try {
        // Run migrations on startup (especially for Render/fresh environments)
        if (env.NODE_ENV !== 'test') {
            // await migrate();
        }

        httpServer.listen(env.PORT, () => {
            console.log(`\n🐾 Pawber API v2.0 running on http://localhost:${env.PORT}`);
            console.log(`📋 Health check: http://localhost:${env.PORT}/health`);
            console.log(`📡 WebSocket: Enabled (Socket.io)`);
            console.log(`🔧 Environment: ${env.NODE_ENV}\n`);
            
            // Start scheduled walk reminders
            walkCronService.start();
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();
