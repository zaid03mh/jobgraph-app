/**
 * JobGraph - Centralized Error Handler Middleware
 * 
 * Provides consistent error responses across the API.
 * Logs detailed error information server-side while returning
 * user-friendly messages to clients.
 */

const { STATUS_CODES, ERROR_CODES } = require('../config/constants');

/**
 * Custom API Error class for throwing standardized errors
 */
class ApiError extends Error {
    constructor(statusCode, message, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found handler - for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(
        STATUS_CODES.NOT_FOUND,
        `Route ${req.originalUrl} not found`,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
const errorHandler = (err, req, res, next) => {
    // Default values
    let statusCode = err.statusCode || STATUS_CODES.INTERNAL_ERROR;
    let message = err.message || 'An unexpected error occurred';
    let errorCode = err.errorCode || ERROR_CODES.DATABASE_ERROR;

    // Log detailed error information (server-side only)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${message}`);
    console.error(`Path: ${req.method} ${req.originalUrl}`);
    console.error(`Error Code: ${errorCode}`);

    if (process.env.NODE_ENV === 'development') {
        console.error('Stack:', err.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Handle specific error types

    // Neo4j constraint violation
    if (err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
        statusCode = STATUS_CODES.CONFLICT;
        message = 'A record with this value already exists';
        errorCode = 'CONSTRAINT_VIOLATION';
    }

    // Neo4j connection errors
    if (err.code === 'ServiceUnavailable' || err.code === 'SessionExpired') {
        statusCode = STATUS_CODES.INTERNAL_ERROR;
        message = 'Database connection error. Please try again later.';
        errorCode = ERROR_CODES.DATABASE_ERROR;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = STATUS_CODES.UNAUTHORIZED;
        message = 'Invalid token';
        errorCode = ERROR_CODES.AUTH_TOKEN_INVALID;
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = STATUS_CODES.UNAUTHORIZED;
        message = 'Token has expired';
        errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
    }

    // Validation errors from express-validator
    if (err.array && typeof err.array === 'function') {
        statusCode = STATUS_CODES.BAD_REQUEST;
        message = 'Validation failed';
        errorCode = ERROR_CODES.VALIDATION_ERROR;
    }

    // Send standardized error response
    const response = {
        status: statusCode,
        message: message,
        errorCode: errorCode
    };

    // Include additional details in development mode
    if (process.env.NODE_ENV === 'development') {
        response.path = `${req.method} ${req.originalUrl}`;
        response.timestamp = new Date().toISOString();

        // Include stack trace only in development
        if (!err.isOperational) {
            response.stack = err.stack;
        }
    }

    res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    notFoundHandler,
    errorHandler,
    asyncHandler
};
