/**
 * JobGraph - Request Validators
 * 
 * Express-validator middleware for input validation.
 * Provides validation rules for all API endpoints.
 */

const { body, param, query, validationResult } = require('express-validator');
const { STATUS_CODES, ERROR_CODES, USER_ROLES } = require('../config/constants');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));

        // Debug logging
        console.log('=== VALIDATION FAILED ===');
        console.log('Path:', req.method, req.originalUrl);
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Errors:', JSON.stringify(formattedErrors, null, 2));
        console.log('=========================');

        return res.status(STATUS_CODES.BAD_REQUEST).json({
            status: STATUS_CODES.BAD_REQUEST,
            message: 'Validation failed',
            errorCode: ERROR_CODES.VALIDATION_ERROR,
            errors: formattedErrors
        });
    }

    next();
};

// ============================================
// Authentication Validators
// ============================================

const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

    body('role')
        .trim()
        .notEmpty().withMessage('Role is required')
        .isIn(Object.values(USER_ROLES)).withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),

    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),

    validate
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate
];

// ============================================
// User Validators
// ============================================

const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),

    validate
];

const skillsValidation = [
    body('skills')
        .isArray({ min: 1 }).withMessage('Skills must be a non-empty array'),

    body('skills.*')
        .trim()
        .notEmpty().withMessage('Skill name cannot be empty')
        .isLength({ max: 50 }).withMessage('Skill name must be at most 50 characters'),

    validate
];

const removeSkillValidation = [
    param('skillName')
        .trim()
        .notEmpty().withMessage('Skill name is required'),

    validate
];

// ============================================
// Job Validators
// ============================================

const createJobValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Job description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

    body('salary')
        .notEmpty().withMessage('Salary is required')
        .custom(value => {
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(num)) throw new Error('Salary must be a number');
            if (num <= 0) throw new Error('Salary must be greater than 0');
            return true;
        }),

    body('skills')
        .isArray({ min: 1 }).withMessage('At least one required skill must be specified'),

    body('skills.*')
        .trim()
        .notEmpty().withMessage('Skill name cannot be empty')
        .isLength({ max: 50 }).withMessage('Skill name must be at most 50 characters'),

    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location must be at most 100 characters'),

    validate
];

const updateJobValidation = [
    param('id')
        .notEmpty().withMessage('Job ID is required'),

    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),

    body('salary')
        .optional()
        .isNumeric().withMessage('Salary must be a number')
        .custom(value => value > 0).withMessage('Salary must be greater than 0'),

    body('skills')
        .optional()
        .isArray({ min: 1 }).withMessage('At least one required skill must be specified'),

    validate
];

const jobIdValidation = [
    param('id')
        .notEmpty().withMessage('Job ID is required'),

    validate
];

// ============================================
// Filter/Query Validators
// ============================================

const jobFilterValidation = [
    query('minSalary')
        .optional()
        .isNumeric().withMessage('Minimum salary must be a number'),

    query('maxSalary')
        .optional()
        .isNumeric().withMessage('Maximum salary must be a number'),

    query('location')
        .optional()
        .trim(),

    query('skills')
        .optional()
        .trim(),

    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    validate
];

// ============================================
// Application Validators
// ============================================

const applyJobValidation = [
    param('jobId')
        .notEmpty().withMessage('Job ID is required'),

    body('coverLetter')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Cover letter must be at most 2000 characters'),

    validate
];

const updateApplicationStatusValidation = [
    param('applicationId')
        .notEmpty().withMessage('Application ID is required'),

    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'reviewed', 'accepted', 'rejected']).withMessage('Invalid status value'),

    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    updateProfileValidation,
    skillsValidation,
    removeSkillValidation,
    createJobValidation,
    updateJobValidation,
    jobIdValidation,
    jobFilterValidation,
    applyJobValidation,
    updateApplicationStatusValidation
};
