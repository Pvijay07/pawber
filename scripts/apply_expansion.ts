import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'pawber',
});

async function run() {
    console.log('🚀 Running expansion schema migration...');
    try {
        const sqlPath = path.join(__dirname, '../src/db/expansion_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Expansion schema applied successfully!');
    } catch (err) {
        console.error('❌ Failed to apply schema:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
