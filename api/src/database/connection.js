'use strict';

/**
 * Neon PostgreSQL connection pool
 * ─────────────────────────────────
 * • Uses DATABASE_URL (single connection string) for Neon / any cloud PG.
 * • SSL is always enabled (required by Neon).
 * • Global singleton prevents connection exhaustion in serverless environments
 *   where the module cache is shared across warm invocations.
 */

const { Pool } = require('pg');

// ── Environment guard ──────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
    throw new Error(
        '❌ DATABASE_URL is not set. ' +
        'Add it to your .env file (local) or Vercel Environment Variables (production).'
    );
}

// ── Singleton pool ────────────────────────────────────────────────────────
// `global._pgPool` survives hot-reloads in development and warm serverless
// function re-invocations, keeping the connection count under control.
if (!global._pgPool) {
    global._pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            // Required for Neon (and most cloud PG providers).
            // rejectUnauthorized: false trusts the server cert without
            // a local CA bundle — safe for managed cloud databases.
            rejectUnauthorized: false,
        },
        // Serverless-friendly pool size: keep it small so Neon's
        // connection limit is not hit across concurrent invocations.
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
    });

    global._pgPool.on('error', (err) => {
        console.error('❌ Unexpected PostgreSQL pool error:', err.message);
    });

    console.log('✅ PostgreSQL pool initialised (Neon)');
}

const pool = global._pgPool;

/**
 * Execute a parameterised query.
 * @param {string} text   SQL string with $1, $2 … placeholders
 * @param {Array}  params Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
exports.query = (text, params) => pool.query(text, params);

/**
 * Obtain a client from the pool for multi-statement transactions.
 * Remember to call client.release() in a finally block.
 * @returns {Promise<import('pg').PoolClient>}
 */
exports.getClient = () => pool.connect();

/**
 * Lightweight connectivity check — used by health-check routes.
 */
exports.connectDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT 1');
        console.log('✅ Database connectivity verified (Neon)');
    } finally {
        client.release();
    }
};

module.exports = exports;
