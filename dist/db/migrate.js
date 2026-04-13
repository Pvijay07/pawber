"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const config_1 = require("../config");
const supabase_1 = require("../shared/lib/supabase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
/**
 * Run database migrations.
 * In production, we use the postgres connection string to run DDL (tables/indices)
 * and then use the Supabase client for data seeding.
 */
async function migrate() {
    try {
        console.log('🔄 Initiating Database Migration Strategy...');
        // 1. Run DDL (Tables/Schema) via raw PostgreSql connection
        await runDDL();
        // 2. Run Seeding via Supabase Client (if configured)
        if ((0, supabase_1.isSupabaseConfigured)()) {
            console.log('🔄 Running Supabase data seeding...');
            await migrateSupabase();
        }
        else {
            console.log('🔄 Running local PostgreSql seeding...');
            // Local seeding logic if needed
        }
        console.log('✅ Database migration and seeding successful!');
    }
    catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (config_1.env.NODE_ENV !== 'production')
            throw err;
    }
}
async function runDDL() {
    const connectionString = config_1.env.DATABASE_URL || `postgresql://${config_1.env.DB_USER}:${config_1.env.DB_PASS}@${config_1.env.DB_HOST}:${config_1.env.DB_PORT}/${config_1.env.DB_NAME}`;
    console.log(`  🔌 Connecting to database for DDL: ${connectionString.split('@')[1] || 'local'}`);
    const pool = new pg_1.Pool({
        connectionString,
        ssl: config_1.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    try {
        // Find seeds.sql in dist/db folder (production) or src/db (dev)
        let sqlPath = path_1.default.join(process.cwd(), 'dist', 'db', 'seeds.sql');
        if (!fs_1.default.existsSync(sqlPath)) {
            sqlPath = path_1.default.join(__dirname, 'seeds.sql'); // Try relative to current file
        }
        if (!fs_1.default.existsSync(sqlPath)) {
            sqlPath = path_1.default.join(process.cwd(), 'src', 'db', 'seeds.sql'); // Final fallback
        }
        if (fs_1.default.existsSync(sqlPath)) {
            console.log(`  📜 Executing DDL from: ${path_1.default.basename(sqlPath)}`);
            const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
            await pool.query(sql);
            console.log('  ✅ DDL execution completed successfully');
        }
        else {
            console.warn('  ⚠️ seeds.sql not found, skipping DDL phase');
        }
    }
    catch (err) {
        console.error('  ❌ DDL phase failed:', err.message);
        throw err;
    }
    finally {
        await pool.end();
    }
}
async function migrateSupabase() {
    const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
    const supabase = createClient(config_1.env.SUPABASE_URL, config_1.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('  📝 Seeding dynamic content...');
    await seedSiteContent(supabase);
    await seedServices(supabase);
}
async function seedSiteContent(supabase) {
    const content = [
        {
            key: 'client_how_it_works',
            type: 'steps',
            is_active: true,
            content: [
                { title: 'Choose Service', description: 'Select from grooming, walking, vet visits, or boarding.', icon: 'Scissors' },
                { title: 'Pick a Pro', description: 'Browse expert profiles, ratings, and book your preferred date/time.', icon: 'Users' },
                { title: 'Relax & Track', description: 'Track the session live and pay securely via the app.', icon: 'MapPin' }
            ],
        },
        {
            key: 'provider_how_it_works',
            type: 'steps',
            is_active: true,
            content: [
                { title: 'Setup Profile', description: 'List your services, prices, and upload your certifications.', icon: 'Info' },
                { title: 'Get Requests', description: 'Receive real-time booking requests from pet parents nearby.', icon: 'Bell' },
                { title: 'Start Earning', description: 'Complete jobs, collect positive reviews, and withdraw earnings daily.', icon: 'Zap' }
            ],
        },
        {
            key: 'client_home_banners',
            type: 'banners',
            is_active: true,
            content: [
                {
                    title: 'Professional Grooming at Home',
                    subtitle: 'Get 20% off on your first spa session',
                    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400',
                    action: 'bookingFlow',
                    serviceId: 'grooming'
                },
                {
                    title: 'Certified Vet Consultations',
                    subtitle: 'Talk to an expert instantly',
                    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=800&h=400',
                    action: 'bookingFlow',
                    serviceId: 'vet'
                }
            ],
        }
    ];
    const { error } = await supabase.from('site_content').upsert(content, { onConflict: 'key' });
    if (error) {
        console.error('  ❌ site_content seed failed:', error.message);
    }
    else {
        console.log('  ✅ site_content seeded');
    }
}
async function seedServices(supabase) {
    const services = [
        { name: 'Grooming', slug: 'grooming', description: 'Complete grooming and spa', category: 'care', is_active: true },
        { name: 'Vet Visit', slug: 'vet', description: 'Professional vet care', category: 'health', is_active: true },
        { name: 'Boarding', slug: 'boarding', description: 'Safe pet stays', category: 'stay', is_active: true },
        { name: 'Dog Walking', slug: 'walking', description: 'Daily exercise for your pet', category: 'exercise', is_active: true }
    ];
    const { error } = await supabase.from('services').upsert(services, { onConflict: 'slug' });
    if (error) {
        console.warn('  ⚠️ services seed failed:', error.message);
    }
    else {
        console.log('  ✅ services seeded');
    }
}
// Run if called directly
if (require.main === module) {
    migrate().catch(() => process.exit(1));
}
//# sourceMappingURL=migrate.js.map