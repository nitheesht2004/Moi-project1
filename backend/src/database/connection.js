const { Pool } = require('pg');

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required database environment variables:', missingEnvVars.join(', '));
    console.error('Please ensure all database credentials are set in your .env file');
    throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

// Create PostgreSQL connection pool with validated credentials
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD), // Explicitly convert to string to prevent SCRAM errors
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
});

exports.query = (text, params) => pool.query(text, params);

exports.connectDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   User: ${process.env.DB_USER}`);
        client.release();
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.error('   Please verify your database credentials and ensure PostgreSQL is running');
        throw error;
    }
};

module.exports = exports;
