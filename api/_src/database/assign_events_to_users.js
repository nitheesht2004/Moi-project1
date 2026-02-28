const { Pool } = require('pg');
require('dotenv').config();

// Uses DATABASE_URL (Neon-compatible) instead of individual host/port vars
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function assignEventsToUsers() {
    try {
        console.log('\n=== ASSIGNING EVENTS TO CORRECT USERS ===\n');

        // Get all users
        const usersResult = await pool.query('SELECT id, username FROM users ORDER BY id');
        console.log('👥 Available users:');
        console.table(usersResult.rows);

        if (usersResult.rows.length < 2) {
            console.log('\n⚠️  You only have 1 user. Creating a second user for testing...');
            await pool.query(
                `INSERT INTO users (username, password, role) 
                 VALUES ($1, $2, $3)`,
                ['testuser2', '$2b$10$dummy_hash', 'family']
            );
            console.log('✅ Created testuser2 (password needs to be set properly)');
        }

        // Get all events
        const eventsResult = await pool.query('SELECT id, name, user_id FROM events ORDER BY id');
        console.log('\n📋 Current events:');
        console.table(eventsResult.rows);

        const halfPoint = Math.ceil(eventsResult.rows.length / 2);
        const user1Id = usersResult.rows[0].id;
        const user2Id = usersResult.rows[1]?.id || user1Id;

        console.log(`\n🔄 Assigning first ${halfPoint} events to user ${user1Id}`);
        console.log(`🔄 Assigning remaining events to user ${user2Id}`);

        // Assign first half to user 1
        for (let i = 0; i < halfPoint && i < eventsResult.rows.length; i++) {
            await pool.query(
                'UPDATE events SET user_id = $1 WHERE id = $2',
                [user1Id, eventsResult.rows[i].id]
            );
        }

        // Assign second half to user 2
        for (let i = halfPoint; i < eventsResult.rows.length; i++) {
            await pool.query(
                'UPDATE events SET user_id = $1 WHERE id = $2',
                [user2Id, eventsResult.rows[i].id]
            );
        }

        // Verify
        const verifyResult = await pool.query('SELECT id, name, user_id FROM events ORDER BY id');
        console.log('\n✅ Updated events:');
        console.table(verifyResult.rows);

        await pool.end();
        console.log('\n🎉 Done! Events have been assigned to different users for testing.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

assignEventsToUsers();
