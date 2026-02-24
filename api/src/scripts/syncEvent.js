require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function syncEvent(eventId, eventName, userId) {
    try {
        console.log(`🔄 Syncing event to database...`);
        console.log(`  Event ID: ${eventId}`);
        console.log(`  Event Name: ${eventName}`);
        console.log(`  User ID: ${userId}`);

        // Check if event already exists
        const existing = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);

        if (existing.rows.length > 0) {
            console.log('✅ Event already exists in database');
            return existing.rows[0];
        }

        // Insert event with specific ID
        const result = await pool.query(
            'INSERT INTO events (id, name, user_id) VALUES ($1, $2, $3) RETURNING *',
            [eventId, eventName, userId]
        );

        console.log('✅ Event synced to database:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('❌ Error syncing event:', error.message);
        throw error;
    }
}

// Example usage:
// node src/scripts/syncEvent.js <eventId> <eventName> <userId>
const eventId = process.argv[2];
const eventName = process.argv[3];
const userId = process.argv[4] || 1; // Default to user 1

if (!eventId || !eventName) {
    console.error('Usage: node syncEvent.js <eventId> <eventName> [userId]');
    console.error('Example: node syncEvent.js 1769340679486 "Wedding" 1');
    process.exit(1);
}

syncEvent(eventId, eventName, userId)
    .then(() => {
        pool.end();
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        pool.end();
        process.exit(1);
    });
