'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ──────────────────────────────────────────────
// CORS — robust for Vercel + local dev
// ──────────────────────────────────────────────
app.use(
    cors({
        origin: (origin, callback) => {
            // 1. Allow calls with no origin (like mobile apps, curl, direct browser hits to /api/health)
            if (!origin) return callback(null, true);

            // 2. Allow specific whitelisted origins
            const whitelist = [
                process.env.CORS_ORIGIN,
                'http://localhost:3000',
                'http://localhost:5173',
            ].filter(Boolean);

            if (whitelist.includes(origin)) {
                return callback(null, true);
            }

            // 3. Allow ANY vercel.app subdomain (useful for preview deployments)
            if (origin.endsWith('.vercel.app')) {
                return callback(null, true);
            }

            // 4. Fallback to rejecting (strict for prod)
            console.warn(`[cors] Blocking restricted origin: ${origin}`);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);

// ──────────────────────────────────────────────
// Core middleware
// ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──────────────────────────────────────────────
// Diagnostics & Health — Move ABOVE main router
// ──────────────────────────────────────────────

// Request Logger (only for Vercel logs)
app.use((req, res, next) => {
    console.log(`[request] ${req.method} ${req.url} (Path: ${req.path}, Origin: ${req.headers.origin})`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DB connectivity diagnostic
const { Pool } = require('pg');
let _diagPool;
function getDiagPool() {
    if (!_diagPool) {
        _diagPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 1,
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 5_000,
        });
    }
    return _diagPool;
}

app.get('/api/test-db', async (req, res) => {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({
            success: false,
            error: 'DATABASE_URL is not set on this deployment.',
        });
    }

    let client;
    try {
        client = await getDiagPool().connect();
        const result = await client.query('SELECT NOW() AS current_time;');
        const currentTime = result.rows[0].current_time;

        console.log('[test-db] ✅ Connected. Server time:', currentTime);

        return res.status(200).json({
            success: true,
            message: 'Database connection is healthy.',
            database_time: currentTime,
        });
    } catch (err) {
        console.error('[test-db] ❌ Error:', err.message);
        return res.status(504).json({
            success: false,
            error: 'Database connection failed.',
            detail: err.message,
        });
    } finally {
        if (client) client.release();
    }
});

// Diagnostic route to check shelf schema
app.get('/api/debug-schema', async (req, res) => {
    let client;
    try {
        client = await getDiagPool().connect();
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        const columns = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users'
        `);

        return res.status(200).json({
            success: true,
            tables: tables.rows.map(r => r.table_name),
            users_columns: columns.rows
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (client) client.release();
    }
});

// "Fix-it" route: Run full database schema repair
app.get('/api/run-migration', async (req, res) => {
    let client;
    try {
        client = await getDiagPool().connect();
        console.log('[migration] Starting full schema repair...');

        // 1. Repair USERS table (add missing columns)
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
        `);
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL');
        console.log('[migration] users table repaired.');

        // 2. Create EVENTS table if missing
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[migration] events table verified/created.');

        // 3. Create ENTRIES table if missing
        await client.query(`
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
                denominations JSONB,
                notes TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[migration] entries table verified/created.');

        return res.status(200).json({
            success: true,
            message: 'All tables (users, events, entries) and columns (email, full_name, role) have been verified and repaired.'
        });
    } catch (err) {
        console.error('[migration] ❌ Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        if (client) client.release();
    }
});




// ──────────────────────────────────────────────
// Routes – mounted under /api
// ──────────────────────────────────────────────
app.use('/api', routes);


// ──────────────────────────────────────────────
// Global async error wrapper helper
// ──────────────────────────────────────────────
// Attach to app so controllers can use it: app.asyncHandler(fn)
app.asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ──────────────────────────────────────────────
// Error handling (must be last)
// ──────────────────────────────────────────────
app.use(errorHandler);

// DO NOT call app.listen() — serverless-http handles invocation.
module.exports = app;
