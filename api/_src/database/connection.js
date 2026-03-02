'use strict';

/**
 * Neon PostgreSQL connection pool
 * ─────────────────────────────────
 * IMPORTANT for Vercel serverless:
 *   - Do NOT throw at module load time if DATABASE_URL is missing.
 *     A top-level throw crashes the entire function before it can send
 *     any response, causing Vercel to return a silent 504 timeout.
 *   - Instead, surface the error at query-time so the controller can
 *     catch it and return a proper JSON error to the client.
 */

const { Pool } = require('pg');

// ── Diagnostics (visible in Vercel Function Logs) ─────────────────────────
console.log('[db] Module loaded. DATABASE_URL present:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    // Log a safe excerpt — enough to verify the host without exposing credentials.
    try {
        const url = new URL(process.env.DATABASE_URL);
        console.log('[db] Connecting to host:', url.hostname, '| DB:', url.pathname.replace('/', ''));
    } catch (_) {
        console.log('[db] DATABASE_URL is set but could not be parsed as a URL.');
    }
}

// ── Singleton pool ────────────────────────────────────────────────────────
// Lazily created so a missing DATABASE_URL doesn't crash cold-start.
function getPool() {
    if (!process.env.DATABASE_URL) {
        // Throw here — at call-time — so controllers can catch and respond.
        throw new Error(
            'DATABASE_URL is not configured. ' +
            'Add it in Vercel → Project → Settings → Environment Variables.'
        );
    }

    if (!global._pgPool) {
        console.log('[db] Creating new pg.Pool...');
        global._pgPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                // Required by Neon. Trusts the server cert without a local CA bundle.
                rejectUnauthorized: false,
            },
            // Keep pool small — serverless functions are short-lived.
            max: 3,
            idleTimeoutMillis: 20_000,
            // Fail fast: if Neon doesn't respond in 8s, throw rather than hang
            // until Vercel's 10s hard timeout kills the function silently.
            connectionTimeoutMillis: 8_000,
        });

        global._pgPool.on('error', (err) => {
            console.error('[db] Unexpected pool error:', err.message);
        });

        console.log('[db] pg.Pool created successfully.');
    }

    return global._pgPool;
}

/**
 * Execute a parameterised query.
 * @param {string} text   SQL string with $1, $2 … placeholders
 * @param {Array}  params Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
exports.query = (text, params) => {
    const pool = getPool(); // throws if DATABASE_URL missing
    return pool.query(text, params);
};

/**
 * Obtain a client from the pool for multi-statement transactions.
 * Remember to call client.release() in a finally block.
 * @returns {Promise<import('pg').PoolClient>}
 */
exports.getClient = () => {
    const pool = getPool();
    return pool.connect();
};

/**
 * Lightweight connectivity check — used by health-check routes.
 */
exports.connectDatabase = async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        console.log('[db] ✅ Database connectivity verified (Neon)');
    } finally {
        client.release();
    }
};

module.exports = exports;
