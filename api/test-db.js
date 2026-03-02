'use strict';

/**
 * api/test-db.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Minimal Vercel Serverless Function to verify Neon PostgreSQL connectivity.
 *
 * Usage (after deploy):
 *   GET  https://<your-vercel-domain>/api/test-db
 *
 * Environment variable required (set in Vercel dashboard):
 *   DATABASE_URL  — Neon pooled connection string
 *       e.g. postgres://user:pass@ep-xxx.pooler.neon.tech/dbname?sslmode=require
 * ──────────────────────────────────────────────────────────────────────────────
 */

const { Pool } = require('pg');

// Create a new Pool for each cold-start.
// Vercel serverless functions are stateless; a pool per invocation is fine
// and avoids dangling connections across function instances.
let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                // Neon requires SSL; rejectUnauthorized: false avoids certificate
                // chain issues in the serverless environment.
                rejectUnauthorized: false,
            },
            // Keep the pool tiny – serverless functions are short-lived.
            max: 1,
            idleTimeoutMillis: 10_000,
            connectionTimeoutMillis: 5_000,
        });
    }
    return pool;
}

// ──────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Handler
// ──────────────────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
    // Only allow GET for this diagnostic endpoint.
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Guard: ensure DATABASE_URL is present before attempting a connection.
    if (!process.env.DATABASE_URL) {
        console.error('[test-db] DATABASE_URL is not set');
        return res.status(500).json({
            success: false,
            error: 'DATABASE_URL environment variable is not configured on this deployment.',
        });
    }

    const client = await getPool().connect().catch((err) => {
        // Surface connection-level errors (wrong host, bad creds, SSL failure, etc.)
        console.error('[test-db] Pool.connect() failed:', err.message);
        return { __error: err };
    });

    // If getPool().connect() itself threw, client will hold the sentinel object.
    if (client && client.__error) {
        return res.status(504).json({
            success: false,
            error: 'Could not acquire a database connection.',
            detail: client.__error.message,
        });
    }

    try {
        const result = await client.query('SELECT NOW() AS current_time;');
        const currentTime = result.rows[0].current_time;

        console.log('[test-db] ✅ Database connection successful. Server time:', currentTime);

        return res.status(200).json({
            success: true,
            message: 'Database connection is healthy.',
            database_time: currentTime,
            environment: process.env.NODE_ENV || 'production',
        });
    } catch (err) {
        console.error('[test-db] Query failed:', err.message);

        return res.status(500).json({
            success: false,
            error: 'Database query failed.',
            detail: err.message,
        });
    } finally {
        // Always release the client back to the pool.
        client.release();
    }
};
