require('dotenv').config();
const db = require('../database/connection');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    try {
        console.log('Checking users in database...\n');

        const result = await db.query('SELECT id, username, password, role, created_at FROM users');

        if (result.rows.length === 0) {
            console.log('❌ No users found in database!');
            console.log('\nTo create a test user, run:');
            console.log('node src/scripts/createTestUser.js');
        } else {
            console.log(`✅ Found ${result.rows.length} user(s):\n`);

            result.rows.forEach((user, index) => {
                console.log(`User ${index + 1}:`);
                console.log(`  ID: ${user.id}`);
                console.log(`  Username: ${user.username}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Password (first 20 chars): ${user.password.substring(0, 20)}...`);
                console.log(`  Is hashed: ${user.password.startsWith('$2a$') || user.password.startsWith('$2b$') ? '✅ YES' : '❌ NO (PLAIN TEXT!)'}`);
                console.log(`  Created: ${user.created_at}`);
                console.log('');
            });

            // Test login for first user
            if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(`\nTesting password comparison for user: ${user.username}`);

                // Test with common passwords
                const testPasswords = ['admin123', 'password', '123456', user.password];

                for (const testPwd of testPasswords) {
                    try {
                        const isMatch = await bcrypt.compare(testPwd, user.password);
                        if (isMatch) {
                            console.log(`✅ Password "${testPwd}" matches!`);
                        }
                    } catch (error) {
                        console.log(`❌ Password "${testPwd}" - bcrypt error (password might be plain text)`);
                    }
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUsers();
