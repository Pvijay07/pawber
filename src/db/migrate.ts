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

async function migrate() {
    try {
        console.log(`🔄 Reading migration file for database: ${env.DB_NAME}...`);
        const sqlPath = path.join(__dirname, 'migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('📋 Running migration statements against local PostgreSQL...');
        
        // Remove comments and multi-line breaks
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
        
        // Split by semicolon (ignoring semicolons in strings/functions is hard, but simple split might work for our file)
        // A better way is to run the whole thing, but pg doesn't support multi-statement script easily without a loop or specific settings.
        // Actually, pool.query(sql) SHOULD work for multi-statement scripts in node-postgres.
        
        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        await pool.end();
    } catch (err: any) {
        console.error('❌ Migration error:', err.message);
        if (err.detail) console.error('Details:', err.detail);
        process.exit(1);
    }
}

migrate();
