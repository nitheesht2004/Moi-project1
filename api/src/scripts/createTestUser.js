require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database/connection');

async function createTestUser() {
    try {
        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating test user...');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Hashed password:', hashedPassword);

        // Check if user already exists
        const existingUser = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);

        if (existingUser.rows.length > 0) {
            console.log('\n⚠️  User "admin" already exists!');
            console.log('Updating password...');

            await db.query(
                'UPDATE users SET password = $1 WHERE username = $2',
                [hashedPassword, 'admin']
            );

            console.log('✅ Password updated successfully!');
        } else {
            console.log('\nCreating new user...');

            await db.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                ['admin', hashedPassword, 'admin']
            );

            console.log('✅ User created successfully!');
        }

        // Verify the user
        const user = await db.query('SELECT id, username, role FROM users WHERE username = $1', ['admin']);
        console.log('\nUser in database:', user.rows[0]);

        // Test password comparison
        const testPassword = await bcrypt.compare('admin123', hashedPassword);
        console.log('\nPassword comparison test:', testPassword ? '✅ PASS' : '❌ FAIL');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestUser();
