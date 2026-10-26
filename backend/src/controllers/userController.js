/**
 * JobGraph - User Controller
 * 
 * Handles user management operations including skill management.
 * Implements POSSEDE relationship between User and Skill nodes.
 */

const { runQuery } = require('../config/database');
const { STATUS_CODES, ERROR_CODES, USER_ROLES, PAGINATION } = require('../config/constants');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all users (Admin only)
 * GET /api/users
 * 
 * @query {string} [role] - Filter by role
 * @query {number} [page] - Page number (default: 1)
 * @query {number} [limit] - Items per page (default: 10)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const params = { skip, limit: parseInt(limit) };

    let whereClause = '';
    if (role && Object.values(USER_ROLES).includes(role)) {
        whereClause = 'WHERE u.role = $role';
        params.role = role;
    }

    // Get users with pagination
    const result = await runQuery(
        `MATCH (u:User)
         ${whereClause}
         OPTIONAL MATCH (u)-[:POSSEDE]->(s:Skill)
         WITH u, COLLECT(s.name) AS skills
         RETURN u, skills
         ORDER BY u.createdAt DESC
         SKIP $skip LIMIT $limit`,
        params,
        'READ'
    );

    // Get total count
    const countResult = await runQuery(
        `MATCH (u:User) ${whereClause} RETURN COUNT(u) AS total`,
        params,
        'READ'
    );

    const total = countResult[0].get('total');

    const users = result.map(record => {
        const user = record.get('u').properties;
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            title: user.title,
            skills: record.get('skills').filter(s => s !== null)
        };
    });

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Users retrieved successfully',
        data: {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

/**
 * Get user by ID
 * GET /api/users/:id
 * 
 * @param {string} id - User ID
 */
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await runQuery(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (u)-[:POSSEDE]->(s:Skill)
         RETURN u, COLLECT(s.name) AS skills`,
        { id },
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
        message: 'User retrieved successfully',
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
 * Delete user (Admin only)
 * DELETE /api/users/:id
 * 
 * @param {string} id - User ID
 */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
        throw new ApiError(
            STATUS_CODES.BAD_REQUEST,
            'You cannot delete your own account',
            ERROR_CODES.VALIDATION_ERROR
        );
    }

    // Delete user and all their relationships
    const result = await runQuery(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (u)-[r]-()
         DELETE r, u
         RETURN COUNT(u) AS deleted`,
        { id }
    );

    const deleted = result[0].get('deleted');

    if (deleted === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'User not found',
            ERROR_CODES.USER_NOT_FOUND
        );
    }

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'User deleted successfully'
    });
});

/**
 * Add skills to user profile
 * POST /api/users/skills
 * 
 * Creates POSSEDE relationship between User and Skill nodes.
 * Skills are created if they don't exist (using MERGE).
 * 
 * Requires authentication
 * @body {string[]} skills - Array of skill names
 */
const addSkills = asyncHandler(async (req, res) => {
    const { skills } = req.body;

    // Normalize skill names (trim and capitalize first letter)
    const normalizedSkills = skills.map(skill =>
        skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase()
    );

    // Add skills using MERGE to avoid duplicates
    const result = await runQuery(
        `MATCH (u:User {id: $userId})
         UNWIND $skills AS skillName
         MERGE (s:Skill {name: skillName})
         MERGE (u)-[:POSSEDE]->(s)
         WITH u
         MATCH (u)-[:POSSEDE]->(s:Skill)
         RETURN COLLECT(DISTINCT s.name) AS skills`,
        { userId: req.user.id, skills: normalizedSkills }
    );

    const allSkills = result[0].get('skills');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Skills added successfully',
        data: {
            skills: allSkills
        }
    });
});

/**
 * Remove a skill from user profile
 * DELETE /api/users/skills/:skillName
 * 
 * Removes the POSSEDE relationship between User and Skill.
 * The Skill node remains in the database.
 * 
 * Requires authentication
 * @param {string} skillName - Name of the skill to remove
 */
const removeSkill = asyncHandler(async (req, res) => {
    const { skillName } = req.params;

    // Normalize skill name
    const normalizedSkill = skillName.trim().charAt(0).toUpperCase() +
        skillName.trim().slice(1).toLowerCase();

    // Remove the POSSEDE relationship
    const result = await runQuery(
        `MATCH (u:User {id: $userId})-[r:POSSEDE]->(s:Skill {name: $skillName})
         DELETE r
         RETURN COUNT(r) AS deleted`,
        { userId: req.user.id, skillName: normalizedSkill }
    );

    const deleted = result[0].get('deleted');

    if (deleted === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'Skill not found in your profile',
            ERROR_CODES.SKILL_NOT_FOUND
        );
    }

    // Get remaining skills
    const skillsResult = await runQuery(
        `MATCH (u:User {id: $userId})-[:POSSEDE]->(s:Skill)
         RETURN COLLECT(s.name) AS skills`,
        { userId: req.user.id },
        'READ'
    );

    const remainingSkills = skillsResult[0].get('skills');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Skill removed successfully',
        data: {
            skills: remainingSkills
        }
    });
});

/**
 * Get user's skills
 * GET /api/users/skills
 * 
 * Requires authentication
 */
const getMySkills = asyncHandler(async (req, res) => {
    const result = await runQuery(
        `MATCH (u:User {id: $userId})-[:POSSEDE]->(s:Skill)
         RETURN COLLECT(s.name) AS skills`,
        { userId: req.user.id },
        'READ'
    );

    const skills = result[0].get('skills');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Skills retrieved successfully',
        data: {
            skills
        }
    });
});

/**
 * Get all available skills in the system
 * GET /api/skills
 */
const getAllSkills = asyncHandler(async (req, res) => {
    const result = await runQuery(
        `MATCH (s:Skill)
         OPTIONAL MATCH (u:User)-[:POSSEDE]->(s)
         OPTIONAL MATCH (j:Job)-[:REQUIERT]->(s)
         RETURN s.name AS name, 
                COUNT(DISTINCT u) AS userCount,
                COUNT(DISTINCT j) AS jobCount
         ORDER BY s.name`,
        {},
        'READ'
    );

    const skills = result.map(record => ({
        name: record.get('name'),
        userCount: record.get('userCount'),
        jobCount: record.get('jobCount')
    }));

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Skills retrieved successfully',
        data: {
            skills,
            total: skills.length
        }
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    addSkills,
    removeSkill,
    getMySkills,
    getAllSkills
};
