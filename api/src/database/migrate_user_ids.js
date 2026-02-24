require('dotenv').config();
const db = require('./connection');

async function migrateUserIds() {
    try {
        console.log('🔄 Starting user_id migration...\n');

        // Step 1: Check current state
        console.log('📊 Step 1: Checking current state...');
        const statsQuery = await db.query(`
            SELECT 
                COUNT(*) as total_events,
                COUNT(user_id) as events_with_user,
                COUNT(*) - COUNT(user_id) as events_without_user
            FROM events
        `);

        const stats = statsQuery.rows[0];
        console.log(`  Total events: ${stats.total_events}`);
        console.log(`  Events with user_id: ${stats.events_with_user}`);
        console.log(`  Events with NULL user_id: ${stats.events_without_user}\n`);

        if (stats.events_without_user === '0') {
            console.log('✅ All events already have user_id assigned!');
            console.log('   No migration needed.\n');
            process.exit(0);
        }

        // Step 2: Show events with NULL user_id
        console.log('📋 Step 2: Events with NULL user_id:');
        const nullEvents = await db.query(`
            SELECT id, name, created_at 
            FROM events 
            WHERE user_id IS NULL
            ORDER BY created_at
        `);
        console.table(nullEvents.rows);

        // Step 3: Get first user
        console.log('👤 Step 3: Getting first user...');
        const userQuery = await db.query('SELECT id, username FROM users ORDER BY id LIMIT 1');

        if (userQuery.rows.length === 0) {
            console.error('❌ No users found in database!');
            console.error('   Please create a user first.');
            process.exit(1);
        }

        const firstUser = userQuery.rows[0];
        console.log(`  First user: ID ${firstUser.id} (${firstUser.username})\n`);

        // Step 4: Assign NULL events to first user
        console.log(`🔧 Step 4: Assigning NULL events to user ${firstUser.id}...`);
        const updateResult = await db.query(`
            UPDATE events 
            SET user_id = $1 
            WHERE user_id IS NULL
            RETURNING id, name, user_id
        `, [firstUser.id]);

        console.log(`✅ Updated ${updateResult.rows.length} events`);
        console.table(updateResult.rows);

        // Step 5: Verify migration
        console.log('\n📊 Step 5: Verifying migration...');
        const verifyQuery = await db.query(`
            SELECT COUNT(*) as remaining_null 
            FROM events 
            WHERE user_id IS NULL
        `);

        const remainingNull = verifyQuery.rows[0].remaining_null;
        if (remainingNull === '0') {
            console.log('✅ Migration successful! No NULL user_id remaining.\n');
        } else {
            console.error(`❌ Migration incomplete! ${remainingNull} events still have NULL user_id\n`);
            process.exit(1);
        }

        // Step 6: Enforce NOT NULL constraint
        console.log('🔒 Step 6: Enforcing NOT NULL constraint...');
        await db.query('ALTER TABLE events ALTER COLUMN user_id SET NOT NULL');
        console.log('✅ NOT NULL constraint added\n');

        // Step 7: Verify constraint
        console.log('🔍 Step 7: Verifying constraint...');
        const constraintQuery = await db.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'user_id'
        `);

        const constraint = constraintQuery.rows[0];
        console.log(`  user_id is_nullable: ${constraint.is_nullable}`);

        if (constraint.is_nullable === 'NO') {
            console.log('✅ Constraint verified!\n');
        } else {
            console.error('❌ Constraint not applied correctly\n');
            process.exit(1);
        }

        // Final summary
        console.log('🎉 Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`  - Assigned ${updateResult.rows.length} events to user ${firstUser.id} (${firstUser.username})`);
        console.log(`  - Enforced NOT NULL constraint on user_id`);
        console.log(`  - All events now have valid user_id`);
        console.log('\n✅ Database is ready for multi-user operation!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed!');
        console.error('Error:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run migration
migrateUserIds();
