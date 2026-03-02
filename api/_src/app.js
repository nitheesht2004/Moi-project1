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
