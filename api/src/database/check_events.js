const db = require('./connection');

async function checkEvents() {
    try {
        console.log('Checking events table...\n');

        // Get all events
        const result = await db.query('SELECT id, name, user_id FROM events ORDER BY id');

        console.log('Current events in database:');
        console.table(result.rows);

        const nullCount = result.rows.filter(r => r.user_id === null).length;
        const totalCount = result.rows.length;

        console.log(`\n📊 Summary:`);
        console.log(`  Total events: ${totalCount}`);
        console.log(`  Events with NULL user_id: ${nullCount}`);
        console.log(`  Events with valid user_id: ${totalCount - nullCount}`);

        if (nullCount > 0) {
            console.log(`\n⚠️  WARNING: ${nullCount} events have NULL user_id!`);
            console.log('   These events need to be assigned to a user.');
        } else {
            console.log(`\n✅ All events have valid user_id`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkEvents();
