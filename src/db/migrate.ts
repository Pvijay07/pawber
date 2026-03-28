import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config';

const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
});

export async function migrate() {
    try {
        console.log(`🔄 Reading migration file for database: ${env.DB_NAME}...`);
        const sqlPath = path.join(__dirname, 'migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('📋 Running migration statements against local PostgreSQL...');
        
        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
    } catch (err: any) {
        console.error('❌ Migration error:', err.message);
        if (err.detail) console.error('Details:', err.detail);
        // Don't exit process if called from server
        throw err;
    }
}

// Run if called directly
if (require.main === module) {
    migrate().then(() => pool.end()).catch(() => process.exit(1));
}
