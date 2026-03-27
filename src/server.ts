import dotenv from 'dotenv';
dotenv.config();

import { env } from './config';
import { createApp } from './app';

const app = createApp();

app.listen(env.PORT, () => {
    console.log(`\n🐾 PetCare API v2.0 running on http://localhost:${env.PORT}`);
    console.log(`📋 Health check: http://localhost:${env.PORT}/health`);
    console.log(`🔧 Environment: ${env.NODE_ENV}\n`);
});
