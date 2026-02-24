'use strict';

require('dotenv').config();
const serverless = require('serverless-http');
const app = require('./src/app');

// Validate critical environment variables at cold-start
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    // Do NOT throw here – let the first request surface a proper 500
    // so Vercel's deploy doesn't silently swallow the error.
}

// Export the Express app wrapped in serverless-http.
// Vercel invokes module.exports as a plain serverless function.
module.exports = serverless(app);
