const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
});

async function checkDatabase() {
    try {
        console.log('\n=== CHECKING DATABASE STATE ===\n');

        // Check events
        const eventsResult = await pool.query('SELECT id, name, user_id FROM events ORDER BY id');
        console.log('📋 EVENTS TABLE:');
        console.table(eventsResult.rows);

        const nullCount = eventsResult.rows.filter(e => e.user_id === null).length;
        console.log(`\nTotal events: ${eventsResult.rows.length}`);
        console.log(`Events with NULL user_id: ${nullCount}`);

        if (nullCount > 0) {
            console.log('\n⚠️  WARNING: Found events with NULL user_id!');
            console.log('These events need to be fixed.\n');
        }

        // Check users
        const usersResult = await pool.query('SELECT id, username FROM users ORDER BY id');
        console.log('\n👥 USERS TABLE:');
        console.table(usersResult.rows);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

checkDatabase();
