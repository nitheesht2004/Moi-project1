// Migration script to add email and full_name to users table
const db = require('../connection');


async function runMigration() {
    try {
        console.log('🔄 Running migration: Add email and full_name to users table...');

        // Add columns
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)
        `);
        console.log('✅ Columns added successfully');

        // Add unique constraint on email
        await db.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique 
            ON users(email) WHERE email IS NOT NULL
        `);
        console.log('✅ Unique constraint added on email');

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
