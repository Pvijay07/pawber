"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
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
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
    }
    catch (err) {
        console.error('❌ Migration error:', err.message);
        if (err.detail)
            console.error('Details:', err.detail);
        // Don't exit process if called from server
        throw err;
    }
}
// Run if called directly
if (require.main === module) {
    migrate().then(() => pool.end()).catch(() => process.exit(1));
}
//# sourceMappingURL=migrate.js.map