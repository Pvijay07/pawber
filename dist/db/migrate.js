"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const config_1 = require("../config");
const pool = new pg_1.Pool({
    host: config_1.env.DB_HOST,
    port: config_1.env.DB_PORT,
    user: config_1.env.DB_USER,
    password: config_1.env.DB_PASS,
    database: config_1.env.DB_NAME,
});
async function migrate() {
    try {
        console.log(`🔄 Reading migration file for database: ${config_1.env.DB_NAME}...`);
        const sqlPath = path_1.default.join(__dirname, 'migration.sql');
        const sql = fs_1.default.readFileSync(sqlPath, 'utf-8');
        console.log('📋 Running migration statements against local PostgreSQL...');
        // Remove comments and multi-line breaks
        const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '');
        // Split by semicolon (ignoring semicolons in strings/functions is hard, but simple split might work for our file)
        // A better way is to run the whole thing, but pg doesn't support multi-statement script easily without a loop or specific settings.
        // Actually, pool.query(sql) SHOULD work for multi-statement scripts in node-postgres.
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
        await pool.end();
    }
    catch (err) {
        console.error('❌ Migration error:', err.message);
        if (err.detail)
            console.error('Details:', err.detail);
        process.exit(1);
    }
}
migrate();
//# sourceMappingURL=migrate.js.map