/**
 * JobGraph - Authentication Middleware
 * 
 * JWT verification and role-based access control middleware.
 * Protects routes and validates user permissions.
 */

const jwt = require('jsonwebtoken');
const { STATUS_CODES, ERROR_CODES } = require('../config/constants');

/**
 * Verify JWT token and attach user to request
 * Usage: router.get('/protected', authenticate, handler)
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                status: STATUS_CODES.UNAUTHORIZED,
                message: 'Access denied. No token provided.',
                errorCode: ERROR_CODES.AUTH_NO_TOKEN
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request object
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                status: STATUS_CODES.UNAUTHORIZED,
                message: 'Token has expired. Please login again.',
                errorCode: ERROR_CODES.AUTH_TOKEN_EXPIRED
            });
        }

        return res.status(STATUS_CODES.UNAUTHORIZED).json({
            status: STATUS_CODES.UNAUTHORIZED,
            message: 'Invalid token.',
            errorCode: ERROR_CODES.AUTH_TOKEN_INVALID
        });
    }
};

/**
 * Role-based access control middleware factory
 * Usage: router.post('/admin-only', authenticate, authorize('admin'), handler)
 * 
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                status: STATUS_CODES.UNAUTHORIZED,
                message: 'Authentication required.',
                errorCode: ERROR_CODES.AUTH_NO_TOKEN
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(STATUS_CODES.FORBIDDEN).json({
                status: STATUS_CODES.FORBIDDEN,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                errorCode: ERROR_CODES.USER_INVALID_ROLE
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work differently for authenticated users
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name
            };
        }

        next();
    } catch (error) {
        // Token invalid but we don't fail - just proceed without user
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
