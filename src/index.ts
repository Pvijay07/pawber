import { env } from './config';
import { createApp } from './app';

const app = createApp();
const PORT = env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`\n🐾 PetCare API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${env.NODE_ENV || 'development'}\n`);
});

export default app;
