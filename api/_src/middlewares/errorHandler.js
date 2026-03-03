'use strict';

/**
 * Global Express error-handling middleware.
 *
 * Must be registered LAST with app.use(errorHandler).
 * Catches errors forwarded via next(err) — including those thrown in
 * async route handlers wrapped with try/catch or asyncHandler.
 */
exports.errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    const isProduction = process.env.NODE_ENV === 'production';

    // Always log the full error server-side for debugging
    console.error('❌ Unhandled error:');
    console.error('  Method :', req.method);
    console.error('  URL    :', req.url);
    console.error('  Message:', err.message);
    if (!isProduction) {
        console.error('  Stack  :', err.stack);
    }

    const statusCode = err.statusCode || err.status || 500;
    const message =
        // Expose the error message unless it's a raw 500 in production
        isProduction && statusCode === 500
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        // Include stack trace only in development
        ...(isProduction ? {} : { stack: err.stack }),
    });

};
