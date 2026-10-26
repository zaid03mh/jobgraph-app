/**
 * JobGraph - Authentication Controller
 * 
 * Handles user registration, login, and profile management.
 * Implements secure password hashing and JWT token generation.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { runQuery } = require('../config/database');
const { STATUS_CODES, ERROR_CODES, USER_ROLES } = require('../config/constants');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Generate JWT token for a user
 * @param {object} user - User object with id, email, role, name
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Register a new user
 * POST /api/auth/register
 * 
 * @body {string} name - User's full name
 * @body {string} email - User's email address (unique)
 * @body {string} password - User's password (min 6 characters)
 * @body {string} role - User's role (admin, recruteur, candidat)
 * @body {string} [title] - User's professional title (optional)
 */
const register = asyncHandler(async (req, res) => {
    const { name, email, password, role, title } = req.body;

    // Check if user already exists
    const existingUser = await runQuery(
        'MATCH (u:User {email: $email}) RETURN u',
        { email: email.toLowerCase() },
        'READ'
    );

    if (existingUser.length > 0) {
        throw new ApiError(
            STATUS_CODES.CONFLICT,
            'A user with this email already exists',
            ERROR_CODES.USER_ALREADY_EXISTS
        );
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique user ID
    const userId = uuidv4();

    // Create user in Neo4j
    const result = await runQuery(
        `CREATE (u:User {
            id: $id,
            name: $name,
            email: $email,
            password: $password,
            role: $role,
            title: $title,
            createdAt: datetime()
        })
        RETURN u`,
        {
            id: userId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role,
            title: title?.trim() || ''
        }
    );

    const user = result[0].get('u').properties;

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (without password)
    res.status(STATUS_CODES.CREATED).json({
        status: STATUS_CODES.CREATED,
        message: 'User registered successfully',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                title: user.title
            },
            token
        }
    });
});

/**
 * Login user
 * POST /api/auth/login
 * 
 * @body {string} email - User's email address
 * @body {string} password - User's password
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const result = await runQuery(
        'MATCH (u:User {email: $email}) RETURN u',
        { email: email.toLowerCase().trim() },
        'READ'
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.UNAUTHORIZED,
            'Invalid email or password',
            ERROR_CODES.AUTH_INVALID_CREDENTIALS
        );
    }

    const user = result[0].get('u').properties;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new ApiError(
            STATUS_CODES.UNAUTHORIZED,
            'Invalid email or password',
            ERROR_CODES.AUTH_INVALID_CREDENTIALS
        );
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (without password)
    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                title: user.title
            },
            token
        }
    });
});

/**
 * Get current user's profile
 * GET /api/auth/profile
 * 
 * Requires authentication
 */
const getProfile = asyncHandler(async (req, res) => {
    // Get user with their skills
    const result = await runQuery(
        `MATCH (u:User {id: $userId})
         OPTIONAL MATCH (u)-[:POSSEDE]->(s:Skill)
         RETURN u, COLLECT(s.name) AS skills`,
        { userId: req.user.id },
        'READ'
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'User not found',
            ERROR_CODES.USER_NOT_FOUND
        );
    }

    const user = result[0].get('u').properties;
    const skills = result[0].get('skills');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Profile retrieved successfully',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                title: user.title,
                skills: skills.filter(s => s !== null)
            }
        }
    });
});

/**
 * Update current user's profile
 * PUT /api/auth/profile
 * 
 * Requires authentication
 * @body {string} [name] - New name
 * @body {string} [title] - New title
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name, title } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = { userId: req.user.id };

    if (name !== undefined) {
        updates.push('u.name = $name');
        params.name = name.trim();
    }

    if (title !== undefined) {
        updates.push('u.title = $title');
        params.title = title.trim();
    }

    if (updates.length === 0) {
        throw new ApiError(
            STATUS_CODES.BAD_REQUEST,
            'No fields to update',
            ERROR_CODES.VALIDATION_ERROR
        );
    }

    updates.push('u.updatedAt = datetime()');

    const result = await runQuery(
        `MATCH (u:User {id: $userId})
         SET ${updates.join(', ')}
         RETURN u`,
        params
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'User not found',
            ERROR_CODES.USER_NOT_FOUND
        );
    }

    const user = result[0].get('u').properties;

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Profile updated successfully',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                title: user.title
            }
        }
    });
});

/**
 * Change password
 * PUT /api/auth/password
 * 
 * Requires authentication
 * @body {string} currentPassword - Current password
 * @body {string} newPassword - New password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const result = await runQuery(
        'MATCH (u:User {id: $userId}) RETURN u',
        { userId: req.user.id },
        'READ'
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'User not found',
            ERROR_CODES.USER_NOT_FOUND
        );
    }

    const user = result[0].get('u').properties;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
        throw new ApiError(
            STATUS_CODES.UNAUTHORIZED,
            'Current password is incorrect',
            ERROR_CODES.AUTH_INVALID_CREDENTIALS
        );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await runQuery(
        `MATCH (u:User {id: $userId})
         SET u.password = $password, u.updatedAt = datetime()`,
        { userId: req.user.id, password: hashedPassword }
    );

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Password changed successfully'
    });
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
