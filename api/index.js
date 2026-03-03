'use strict';

require('dotenv').config();
const app = require('./_src/app');

// Validate critical environment variables at cold-start
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
}

// Export the Express app directly.
// Vercel's Node.js runtime handles Express apps natively when exported.
module.exports = app;

