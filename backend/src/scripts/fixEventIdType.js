require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function fixEventIdType() {
    try {
        console.log('🔄 Fixing event_id type to BIGINT...\n');

        const migrationPath = path.join(__dirname, '../database/migrations/002_fix_event_id_type.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('\nChanges:');
        console.log('  - events.id: INTEGER → BIGINT');
        console.log('  - entries.event_id: INTEGER → BIGINT');
        console.log('\nNow supports frontend-generated timestamp IDs!');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

fixEventIdType();
