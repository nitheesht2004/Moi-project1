'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ──────────────────────────────────────────────
// CORS — allow Vercel deployment + local dev
// ──────────────────────────────────────────────
const allowedOrigins = [
    // Set CORS_ORIGIN in Vercel env to your production domain, e.g. https://yourapp.vercel.app
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:5173',
].filter(Boolean); // remove undefined if CORS_ORIGIN not set

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server calls (no origin) and listed origins
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
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
// Routes  –  all mounted under /api
// ──────────────────────────────────────────────
// Vercel routes /api/* → this file, so Express receives the full path.
// The router handles /api/auth, /api/entries, etc.
app.use('/api', routes);

// Health check (also useful for Vercel function warm-up pings)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
