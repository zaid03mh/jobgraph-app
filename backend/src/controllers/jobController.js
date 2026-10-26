/**
 * JobGraph - Job Controller
 * 
 * Handles job offer management operations.
 * Implements REQUIERT relationship between Job and Skill nodes.
 */

const { v4: uuidv4 } = require('uuid');
const neo4j = require('neo4j-driver');
const { runQuery } = require('../config/database');
const { STATUS_CODES, ERROR_CODES, USER_ROLES, PAGINATION } = require('../config/constants');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new job offer (Recruiter/Admin only)
 * POST /api/jobs
 * 
 * @body {string} title - Job title
 * @body {string} description - Job description
 * @body {number} salary - Salary amount
 * @body {string[]} skills - Required skills for the job
 * @body {string} [location] - Job location (optional)
 */
const createJob = asyncHandler(async (req, res) => {
    const { title, description, salary, skills, location } = req.body;

    // Debug logging
    console.log('=== CREATE JOB DEBUG ===');
    console.log('User:', req.user);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Skills:', skills, 'Type:', typeof skills, 'IsArray:', Array.isArray(skills));
    console.log('========================');

    // Generate unique job ID
    const jobId = uuidv4();

    // Normalize skill names
    const normalizedSkills = skills.map(skill =>
        skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase()
    );

    // Create job and associate skills using REQUIERT relationship
    const result = await runQuery(
        `CREATE (j:Job {
            id: $id,
            title: $title,
            description: $description,
            salary: $salary,
            location: $location,
            date_creation: datetime(),
            recruiterId: $recruiterId
        })
        WITH j
        UNWIND $skills AS skillName
        MERGE (s:Skill {name: skillName})
        CREATE (j)-[:REQUIERT]->(s)
        WITH DISTINCT j
        MATCH (j)-[:REQUIERT]->(s:Skill)
        RETURN j, COLLECT(DISTINCT s.name) AS skills`,
        {
            id: jobId,
            title: title.trim(),
            description: description.trim(),
            salary: parseFloat(salary),
            location: location?.trim() || '',
            skills: normalizedSkills,
            recruiterId: req.user.id
        }
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.INTERNAL_ERROR,
            'Failed to create job - no result returned',
            ERROR_CODES.DATABASE_ERROR
        );
    }

    const job = result[0].get('j').properties;
    const jobSkills = result[0].get('skills');

    res.status(STATUS_CODES.CREATED).json({
        status: STATUS_CODES.CREATED,
        message: 'Job offer created successfully',
        data: {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                salary: job.salary,
                location: job.location,
                date_creation: job.date_creation,
                skills: jobSkills
            }
        }
    });
});

/**
 * Get all job offers with optional filters
 * GET /api/jobs
 * 
 * @query {number} [minSalary] - Minimum salary filter
 * @query {number} [maxSalary] - Maximum salary filter
 * @query {string} [location] - Location filter (partial match)
 * @query {string} [skills] - Comma-separated skills filter
 * @query {number} [page] - Page number
 * @query {number} [limit] - Items per page
 */
const getAllJobs = asyncHandler(async (req, res) => {
    const {
        minSalary,
        maxSalary,
        location,
        skills,
        page = PAGINATION.DEFAULT_PAGE,
        limit = PAGINATION.DEFAULT_LIMIT
    } = req.query;

    const skipVal = (parseInt(page) - 1) * parseInt(limit);
    const limitVal = parseInt(limit);
    const params = { skip: neo4j.int(skipVal), limit: neo4j.int(limitVal) };

    // Build WHERE clauses dynamically
    const conditions = [];

    if (minSalary) {
        conditions.push('j.salary >= $minSalary');
        params.minSalary = parseFloat(minSalary);
    }

    if (maxSalary) {
        conditions.push('j.salary <= $maxSalary');
        params.maxSalary = parseFloat(maxSalary);
    }

    if (location) {
        conditions.push('toLower(j.location) CONTAINS toLower($location)');
        params.location = location;
    }

    let skillFilter = '';
    if (skills) {
        const skillList = skills.split(',').map(s =>
            s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase()
        );
        params.skillFilter = skillList;
        skillFilter = `
            WITH j, skills
            WHERE ALL(skill IN $skillFilter WHERE skill IN skills)
        `;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get jobs with pagination
    const result = await runQuery(
        `MATCH (j:Job)
         ${whereClause}
         OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
         WITH j, COLLECT(s.name) AS skills
         ${skillFilter}
         OPTIONAL MATCH (recruiter:User {id: j.recruiterId})
         RETURN j, skills, recruiter.name AS recruiterName
         ORDER BY j.date_creation DESC
         SKIP $skip LIMIT $limit`,
        params,
        'READ'
    );

    // Get total count
    const countResult = await runQuery(
        `MATCH (j:Job)
         ${whereClause}
         ${skills ? `
             OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
             WITH j, COLLECT(s.name) AS skills
             WHERE ALL(skill IN $skillFilter WHERE skill IN skills)
         ` : ''}
         RETURN COUNT(DISTINCT j) AS total`,
        params,
        'READ'
    );

    const total = countResult[0].get('total');

    const jobs = result.map(record => {
        const job = record.get('j').properties;
        return {
            id: job.id,
            title: job.title,
            description: job.description,
            salary: job.salary,
            location: job.location,
            date_creation: job.date_creation,
            skills: record.get('skills'),
            recruiterName: record.get('recruiterName')
        };
    });

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Jobs retrieved successfully',
        data: {
            jobs,
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
 * Get job by ID
 * GET /api/jobs/:id
 * 
 * @param {string} id - Job ID
 */
const getJobById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await runQuery(
        `MATCH (j:Job {id: $id})
         OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
         OPTIONAL MATCH (recruiter:User {id: j.recruiterId})
         OPTIONAL MATCH (applicant:User)-[a:POSTULE_A]->(j)
         RETURN j, 
                COLLECT(DISTINCT s.name) AS skills,
                recruiter,
                COUNT(DISTINCT applicant) AS applicantCount`,
        { id },
        'READ'
    );

    if (result.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'Job not found',
            ERROR_CODES.JOB_NOT_FOUND
        );
    }

    const job = result[0].get('j').properties;
    const skills = result[0].get('skills');
    const recruiter = result[0].get('recruiter')?.properties;
    const applicantCount = result[0].get('applicantCount');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Job retrieved successfully',
        data: {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                salary: job.salary,
                location: job.location,
                date_creation: job.date_creation,
                skills: skills,
                recruiter: recruiter ? {
                    id: recruiter.id,
                    name: recruiter.name,
                    email: recruiter.email
                } : null,
                applicantCount
            }
        }
    });
});

/**
 * Update job offer (Owner/Admin only)
 * PUT /api/jobs/:id
 * 
 * @param {string} id - Job ID
 * @body {string} [title] - New title
 * @body {string} [description] - New description
 * @body {number} [salary] - New salary
 * @body {string[]} [skills] - New required skills
 * @body {string} [location] - New location
 */
const updateJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, salary, skills, location } = req.body;

    // Check if job exists and user has permission
    const jobCheck = await runQuery(
        'MATCH (j:Job {id: $id}) RETURN j',
        { id },
        'READ'
    );

    if (jobCheck.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'Job not found',
            ERROR_CODES.JOB_NOT_FOUND
        );
    }

    const existingJob = jobCheck[0].get('j').properties;

    // Check ownership (unless admin)
    if (req.user.role !== USER_ROLES.ADMIN && existingJob.recruiterId !== req.user.id) {
        throw new ApiError(
            STATUS_CODES.FORBIDDEN,
            'You can only update your own job offers',
            ERROR_CODES.USER_INVALID_ROLE
        );
    }

    // Build dynamic update query
    const updates = [];
    const params = { id };

    if (title !== undefined) {
        updates.push('j.title = $title');
        params.title = title.trim();
    }

    if (description !== undefined) {
        updates.push('j.description = $description');
        params.description = description.trim();
    }

    if (salary !== undefined) {
        updates.push('j.salary = $salary');
        params.salary = parseFloat(salary);
    }

    if (location !== undefined) {
        updates.push('j.location = $location');
        params.location = location.trim();
    }

    updates.push('j.updatedAt = datetime()');

    // Update job properties
    await runQuery(
        `MATCH (j:Job {id: $id})
         SET ${updates.join(', ')}`,
        params
    );

    // Update skills if provided
    if (skills && skills.length > 0) {
        const normalizedSkills = skills.map(skill =>
            skill.trim().charAt(0).toUpperCase() + skill.trim().slice(1).toLowerCase()
        );

        // Remove existing REQUIERT relationships and create new ones
        await runQuery(
            `MATCH (j:Job {id: $id})-[r:REQUIERT]->()
             DELETE r
             WITH j
             UNWIND $skills AS skillName
             MERGE (s:Skill {name: skillName})
             CREATE (j)-[:REQUIERT]->(s)`,
            { id, skills: normalizedSkills }
        );
    }

    // Get updated job
    const result = await runQuery(
        `MATCH (j:Job {id: $id})
         OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
         RETURN j, COLLECT(s.name) AS skills`,
        { id },
        'READ'
    );

    const job = result[0].get('j').properties;
    const jobSkills = result[0].get('skills');

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Job updated successfully',
        data: {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                salary: job.salary,
                location: job.location,
                date_creation: job.date_creation,
                skills: jobSkills
            }
        }
    });
});

/**
 * Delete job offer (Owner/Admin only)
 * DELETE /api/jobs/:id
 * 
 * @param {string} id - Job ID
 */
const deleteJob = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if job exists and user has permission
    const jobCheck = await runQuery(
        'MATCH (j:Job {id: $id}) RETURN j',
        { id },
        'READ'
    );

    if (jobCheck.length === 0) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            'Job not found',
            ERROR_CODES.JOB_NOT_FOUND
        );
    }

    const existingJob = jobCheck[0].get('j').properties;

    // Check ownership (unless admin)
    if (req.user.role !== USER_ROLES.ADMIN && existingJob.recruiterId !== req.user.id) {
        throw new ApiError(
            STATUS_CODES.FORBIDDEN,
            'You can only delete your own job offers',
            ERROR_CODES.USER_INVALID_ROLE
        );
    }

    // Delete job and all its relationships
    await runQuery(
        `MATCH (j:Job {id: $id})
         OPTIONAL MATCH (j)-[r]-()
         DELETE r, j`,
        { id }
    );

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Job deleted successfully'
    });
});

/**
 * Get jobs created by the current recruiter
 * GET /api/jobs/my-jobs
 * 
 * Requires authentication (Recruiter/Admin)
 */
const getMyJobs = asyncHandler(async (req, res) => {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = req.query;
    const skipVal = (parseInt(page) - 1) * parseInt(limit);

    const result = await runQuery(
        `MATCH (j:Job {recruiterId: $recruiterId})
         OPTIONAL MATCH (j)-[:REQUIERT]->(s:Skill)
         OPTIONAL MATCH (applicant:User)-[:POSTULE_A]->(j)
         WITH j, COLLECT(DISTINCT s.name) AS skills, COUNT(DISTINCT applicant) AS applicantCount
         RETURN j, skills, applicantCount
         ORDER BY j.date_creation DESC
         SKIP $skip LIMIT $limit`,
        { recruiterId: req.user.id, skip: neo4j.int(skipVal), limit: neo4j.int(parseInt(limit)) },
        'READ'
    );

    // Get total count
    const countResult = await runQuery(
        'MATCH (j:Job {recruiterId: $recruiterId}) RETURN COUNT(j) AS total',
        { recruiterId: req.user.id },
        'READ'
    );

    const total = countResult[0].get('total');

    const jobs = result.map(record => {
        const job = record.get('j').properties;
        return {
            id: job.id,
            title: job.title,
            description: job.description,
            salary: job.salary,
            location: job.location,
            date_creation: job.date_creation,
            skills: record.get('skills'),
            applicantCount: record.get('applicantCount')
        };
    });

    res.status(STATUS_CODES.SUCCESS).json({
        status: STATUS_CODES.SUCCESS,
        message: 'Your jobs retrieved successfully',
        data: {
            jobs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});

module.exports = {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getMyJobs
};
