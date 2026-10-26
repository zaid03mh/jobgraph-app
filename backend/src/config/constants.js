/**
 * JobGraph - Application Constants
 * 
 * Central location for all application-wide constants
 * including user roles, status codes, and configuration values.
 */

// User roles in the system
const USER_ROLES = {
    ADMIN: 'admin',
    RECRUITER: 'recruteur',
    CANDIDATE: 'candidat'
};

// Application status for job applications
const APPLICATION_STATUS = {
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

// API response status codes
const STATUS_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
};

// Error codes for specific error types
const ERROR_CODES = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_TOKEN_EXPIRED: 'AUTH_002',
    AUTH_TOKEN_INVALID: 'AUTH_003',
    AUTH_NO_TOKEN: 'AUTH_004',

    // User errors
    USER_NOT_FOUND: 'USER_001',
    USER_ALREADY_EXISTS: 'USER_002',
    USER_INVALID_ROLE: 'USER_003',

    // Job errors
    JOB_NOT_FOUND: 'JOB_001',
    JOB_ALREADY_EXISTS: 'JOB_002',

    // Skill errors
    SKILL_NOT_FOUND: 'SKILL_001',

    // Application errors
    APPLICATION_ALREADY_EXISTS: 'APP_001',
    APPLICATION_NOT_FOUND: 'APP_002',

    // Validation errors
    VALIDATION_ERROR: 'VAL_001',

    // Database errors
    DATABASE_ERROR: 'DB_001'
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

module.exports = {
    USER_ROLES,
    APPLICATION_STATUS,
    STATUS_CODES,
    ERROR_CODES,
    PAGINATION
};
